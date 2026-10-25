import { extractTextFromPdf } from "./pdf-parser";
import type { QuizQuestion } from "./types";

const PRIMARY_GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const FALLBACK_GROQ_MODEL = process.env.GROQ_FALLBACK_MODEL || "llama-3.1-8b-instant";

type GroqPayload = {
  title?: string;
  questions?: Array<{
    type?: string;
    prompt?: string;
    options?: string[];
    answer?: string;
  }>;
};

function asType(value: string | undefined): QuizQuestion["type"] | null {
  if (value === "mcq" || value === "tf" || value === "blank") return value;
  return null;
}

export function sanitizeQuestions(raw: GroqPayload["questions"], count: number): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  for (const item of raw ?? []) {
    const type = asType(item.type);
    const prompt = item.prompt?.trim();
    const answer = String(item.answer ?? "").trim();
    if (!type || !prompt || !answer) continue;

    if (type === "mcq") {
      const options = (item.options ?? []).map((option) => String(option).trim()).filter(Boolean);
      if (options.length < 2 || !options.includes(answer)) continue;
      questions.push({
        id: crypto.randomUUID(),
        type,
        prompt,
        options: options.slice(0, 4),
        answer,
      });
    } else if (type === "tf") {
      const normalized = /^(true|false)$/i.test(answer)
        ? answer.toLowerCase() === "true"
          ? "True"
          : "False"
        : null;
      if (!normalized) continue;
      questions.push({
        id: crypto.randomUUID(),
        type,
        prompt,
        options: ["True", "False"],
        answer: normalized,
      });
    } else {
      questions.push({
        id: crypto.randomUUID(),
        type,
        prompt,
        answer,
      });
    }

    if (questions.length >= count) break;
  }
  return questions;
}

export async function generateQuizWithGroq(
  pdfInput: Buffer | string,
  questionCount: number,
): Promise<{
  title: string;
  questions: QuizQuestion[];
}> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY. Please add it to your environment (.env.local).");
  }

  // 1. Obtain text from PDF input
  let text = typeof pdfInput === "string" ? pdfInput : extractTextFromPdf(pdfInput);
  if (!text || text.trim().length < 50) {
    throw new Error(
      "Could not extract sufficient text from the uploaded PDF for Groq. Ensure the document contains selectable text.",
    );
  }

  // Limit text length to prevent context overflow while providing ample material
  if (text.length > 50000) {
    text = text.slice(0, 50000);
  }

  const systemPrompt = `You create educational quizzes for college students from study notes.
Return JSON ONLY matching this exact schema:
{
  "title": "A short, engaging quiz title based on the notes",
  "questions": [
    {
      "type": "mcq" | "tf" | "blank",
      "prompt": "clear question prompt",
      "options": ["A", "B", "C", "D"],
      "answer": "the correct option text, True/False, or the fill-in word/phrase"
    }
  ]
}

Rules:
- Generate exactly ${questionCount} questions.
- Mix types: multiple-choice (mcq), true/false (tf), and fill-in-the-blank (blank).
- For mcq, options must be an array of exactly 4 strings, and answer must match one of those strings.
- For tf, options must be ["True", "False"] and answer must be either "True" or "False".
- For blank, omit options or leave as empty array; answer must be a concise key term or phrase.
- Every question must be grounded strictly in the provided text. Never invent facts.`;

  const userPrompt = `Here are the study notes extracted from the student's PDF:

---
${text}
---

Create an engaging ${questionCount}-question quiz from these notes. Respond with JSON only.`;

  const modelsToTry = Array.from(new Set([PRIMARY_GROQ_MODEL, FALLBACK_GROQ_MODEL].filter(Boolean)));
  let responseText = "";
  let lastError: unknown = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Groq API returned HTTP ${response.status}: ${errorBody}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      responseText = data.choices?.[0]?.message?.content || "";
      if (responseText) {
        console.info(`[Groq] Successfully generated quiz using model: ${model}`);
        break;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Groq] Model ${model} failed:`, err instanceof Error ? err.message : err);
      if (i < modelsToTry.length - 1) {
        console.info(`[Groq] Trying fallback model: ${modelsToTry[i + 1]}...`);
      }
    }
  }

  if (!responseText && lastError) {
    throw lastError;
  }

  let parsed: GroqPayload;
  try {
    parsed = JSON.parse(responseText) as GroqPayload;
  } catch {
    const match = responseText.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Groq did not return valid quiz JSON.");
    }
    parsed = JSON.parse(match[0]) as GroqPayload;
  }

  const questions = sanitizeQuestions(parsed.questions, questionCount);
  if (questions.length < Math.min(3, questionCount)) {
    throw new Error("Not enough usable questions were generated by Groq. Try a clearer PDF.");
  }

  return {
    title: parsed.title?.trim() || "Quizster Quiz",
    questions,
  };
}
