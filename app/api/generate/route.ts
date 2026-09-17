import { NextRequest, NextResponse } from "next/server";
import { generateQuizFromPdf } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const countRaw = Number(form.get("count") || 10);
    const count = Math.min(15, Math.max(5, Number.isFinite(countRaw) ? countRaw : 10));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a PDF to generate a quiz." }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "PDF must be 8MB or smaller." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const quiz = await generateQuizFromPdf(bytes, count);
    return NextResponse.json(quiz);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Quiz generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
