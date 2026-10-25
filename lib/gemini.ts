import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateQuizWithGroq, sanitizeQuestions } from "./groq";
import type { QuizQuestion } from "./types";

const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash";

function isHighDemandError(error: unknown): boolean {
  if (!error) return false;
  const status = (error as { status?: number })?.status;
  if (status === 503 || status === 429 || status === 504) return true;

  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("high demand") ||
    msg.includes("service unavailable") ||
    msg.includes("temporarily unavailable") ||
    msg.includes("overloaded") ||
    msg.includes("resource_exhausted") ||
    msg.includes("spikes in demand")
  );
}

type GeminiPayload = {
  title?: string;
  questions?: Array<{
    type?: string;
    prompt?: string;
    options?: string[];
    answer?: string;
  }>;
};

export async function generateQuizFromPdf(pdfBytes: Buffer, questionCount: number): Promise<{
  title: string;
  questions: QuizQuestion[];
}> {
  // If Gemini API key is missing but Groq is available, go straight to Groq
  if (!process.env.GEMINI_API_KEY && process.env.GROQ_API_KEY) {
    console.info("[Quizster] GEMINI_API_KEY not configured. Generating with Groq API...");
    return generateQuizWithGroq(pdfBytes, questionCount);
  }

  // Attempt Gemini generation first
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY. Add it to .env.local.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `You create quizzes for college students from study notes.

Return JSON only with this shape:
{
  "title": "short quiz title",
  "questions": [
    {
      "type": "mcq" | "tf" | "blank",
      "prompt": "question text",
      "options": ["A","B","C","D"],
      "answer": "the correct option text, True/False, or the fill-in word/phrase"
    }
  ]
}

Rules:
- Create exactly ${questionCount} questions.
- Mix types: include multiple-choice (mcq), true/false (tf), and fill-in-the-blank (blank).
- For mcq, provide exactly 4 options and set answer to one of those option strings.
- For tf, options must be ["True","False"] and answer must be "True" or "False".
- For blank, omit options; answer should be a short phrase a student would type.
- Use only facts from the PDF. Do not invent material that is not in the document.
- Keep prompts clear and friendly for young students.`;

    const modelsToTry = Array.from(new Set([PRIMARY_MODEL, FALLBACK_MODEL].filter(Boolean)));
    let text = "";
    let lastError: unknown = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const currentModel = modelsToTry[i];
      try {
        const model = genAI.getGenerativeModel({
          model: currentModel,
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        });

        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBytes.toString("base64"),
            },
          },
          { text: prompt },
        ]);

        text = result.response.text();
        if (i > 0) {
          console.info(
            `[Gemini] High demand on primary model. Successfully generated quiz using fallback model: ${currentModel}`,
          );
        }
        break;
      } catch (err) {
        lastError = err;
        const isDemand = isHighDemandError(err);
        const hasNext = i < modelsToTry.length - 1;

        if (isDemand && hasNext) {
          const nextModel = modelsToTry[i + 1];
          console.warn(
            `[Gemini] Model ${currentModel} is experiencing high demand (503/429). Automatically switching to ${nextModel}...`,
          );
          continue;
        }
        throw err;
      }
    }

    if (!text && lastError) {
      throw lastError;
    }

    let parsed: GeminiPayload;
    try {
      parsed = JSON.parse(text) as GeminiPayload;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        throw new Error("Gemini did not return valid quiz JSON.");
      }
      parsed = JSON.parse(match[0]) as GeminiPayload;
    }

    const questions = sanitizeQuestions(parsed.questions, questionCount);
    if (questions.length < Math.min(3, questionCount)) {
      throw new Error("Not enough usable questions were generated. Try a clearer PDF.");
    }

    return {
      title: parsed.title?.trim() || "Quizster Quiz",
      questions,
    };
  } catch (geminiError) {
    const errorMsg = geminiError instanceof Error ? geminiError.message : String(geminiError);
    console.warn(`[Gemini] Encountered error: "${errorMsg}". Checking for Groq fallback...`);

    // In case of ANY error with Gemini (high demand, rate limit, parse error, network error, etc.):
    // Automatically fall back to Groq if GROQ_API_KEY is configured
    if (process.env.GROQ_API_KEY) {
      console.info("[Quizster] Seamlessly falling back to Groq API (llama-3.3-70b-versatile)...");
      try {
        return await generateQuizWithGroq(pdfBytes, questionCount);
      } catch (groqError) {
        console.error("[Groq] Fallback also failed:", groqError);
        const groqMsg = groqError instanceof Error ? groqError.message : String(groqError);
        throw new Error(
          `Quiz generation failed on both Gemini and Groq. Gemini: ${errorMsg}. Groq: ${groqMsg}`,
        );
      }
    }

    // If Groq is not configured, format Gemini error
    if (
      errorMsg.includes("503") ||
      errorMsg.includes("high demand") ||
      errorMsg.includes("Service Unavailable") ||
      errorMsg.includes("spikes in demand")
    ) {
      throw new Error(
        "Gemini servers are currently experiencing high demand. Please add GROQ_API_KEY to .env.local to enable automatic instant fallback.",
      );
    }

    throw geminiError;
  }
}
