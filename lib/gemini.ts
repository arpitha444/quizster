import { GoogleGenerativeAI } from "@google/generative-ai";
import type { QuizQuestion } from "./types";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

type GeminiPayload = {
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

function sanitizeQuestions(raw: GeminiPayload["questions"], count: number): QuizQuestion[] {
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
      const normalized = /^(true|false)$/i.test(answer) ? (answer.toLowerCase() === "true" ? "True" : "False") : null;
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

export async function generateQuizFromPdf(pdfBytes: Buffer, questionCount: number): Promise<{
  title: string;
  questions: QuizQuestion[];
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY. Add it to .env.local.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json",
    },
  });

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

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "application/pdf",
        data: pdfBytes.toString("base64"),
      },
    },
    { text: prompt },
  ]);

  const text = result.response.text();
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
}
