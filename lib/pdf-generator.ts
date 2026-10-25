import type { QuizQuestion } from "./types";
import { isAnswerCorrect } from "./scoring";

export type QuizPdfData = {
  quizTitle: string;
  playerName?: string;
  questions: QuizQuestion[];
  answers: Record<string, string>;
};

/**
 * Generates and triggers download of a beautifully formatted PDF study guide
 * and results summary for the completed quiz.
 */
export function downloadQuizPdf(data: QuizPdfData) {
  const blob = generateQuizPdfBlob(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const cleanTitle = (data.quizTitle || "Quizster-Quiz")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_");
  link.download = `${cleanTitle}-Review.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Builds a pure vector PDF 1.4 document containing:
 * - Quizster Header & Title
 * - Score & Accuracy Summary
 * - Every Question with Prompt, Options, Player's Answer, and Correct Answer
 * - Page numbers and footer
 */
export function generateQuizPdfBlob(data: QuizPdfData): Blob {
  const PAGE_WIDTH = 595.28; // A4 points
  const PAGE_HEIGHT = 841.89;
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 515.28 pt
  const TOP_MARGIN = 40;
  const BOTTOM_MARGIN = 45;

  // Calculate stats
  let correctCount = 0;
  data.questions.forEach((q) => {
    const userAns = data.answers[q.id] ?? "";
    if (isAnswerCorrect(q.type, q.answer, userAns)) {
      correctCount++;
    }
  });
  const totalQuestions = data.questions.length;
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const score = correctCount * 100;
  const maxScore = totalQuestions * 100;

  // Page tracking
  const pages: string[] = [];
  let currentPageStream = "";
  let cursorY = PAGE_HEIGHT - TOP_MARGIN;

  function startNewPage() {
    if (currentPageStream) {
      pages.push(currentPageStream);
    }
    currentPageStream = "";
    cursorY = PAGE_HEIGHT - TOP_MARGIN;
  }

  function ensureSpace(neededHeight: number) {
    if (cursorY - neededHeight < BOTTOM_MARGIN) {
      startNewPage();
    }
  }

  // --- Header on Page 1 ---
  // Header background banner
  const bannerHeight = 85;
  currentPageStream += `
    0.20 0.28 0.49 rg
    ${MARGIN_LEFT} ${cursorY - bannerHeight} ${CONTENT_WIDTH} ${bannerHeight} re f
  `;

  // Banner text
  currentPageStream += `
    BT
    /F2 18 Tf
    1 1 1 rg
    1 0 0 1 ${MARGIN_LEFT + 16} ${cursorY - 26} Tm
    (${escapePdfText(data.quizTitle || "Quizster Quiz")}) Tj
    /F1 10 Tf
    0.85 0.90 1 rg
    1 0 0 1 ${MARGIN_LEFT + 16} ${cursorY - 44} Tm
    (Quizster Study Guide & Results Summary) Tj
    /F1 9 Tf
    1 0 0 1 ${MARGIN_LEFT + 16} ${cursorY - 62} Tm
    (Racer: ${escapePdfText(data.playerName || "Player")}   |   Date: ${escapePdfText(new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }))}) Tj
    ET
  `;

  cursorY -= bannerHeight + 14;

  // Summary Stat Bar
  const statBarHeight = 36;
  currentPageStream += `
    0.96 0.96 0.97 rg
    ${MARGIN_LEFT} ${cursorY - statBarHeight} ${CONTENT_WIDTH} ${statBarHeight} re f
    0.85 0.85 0.88 RG
    0.75 w
    ${MARGIN_LEFT} ${cursorY - statBarHeight} ${CONTENT_WIDTH} ${statBarHeight} re S
    BT
    /F2 11 Tf
    0.15 0.55 0.35 rg
    1 0 0 1 ${MARGIN_LEFT + 16} ${cursorY - 23} Tm
    (Score: ${score} / ${maxScore} pts) Tj
    /F2 11 Tf
    0.15 0.20 0.35 rg
    1 0 0 1 ${MARGIN_LEFT + 160} ${cursorY - 23} Tm
    (Accuracy: ${percentage}%) Tj
    /F1 10 Tf
    0.35 0.35 0.40 rg
    1 0 0 1 ${MARGIN_LEFT + 280} ${cursorY - 23} Tm
    (${correctCount} Correct   ·   ${totalQuestions - correctCount} Missed   ·   ${totalQuestions} Total Questions) Tj
    ET
  `;

  cursorY -= statBarHeight + 20;

  // --- Questions Section ---
  data.questions.forEach((q, index) => {
    const userAns = data.answers[q.id] ?? "";
    const isCorrect = isAnswerCorrect(q.type, q.answer, userAns);

    // Format type label
    const typeLabel =
      q.type === "mcq"
        ? "Multiple Choice"
        : q.type === "tf"
        ? "True / False"
        : "Fill in the Blank";

    // Wrap question prompt
    const promptLines = wrapText(q.prompt, CONTENT_WIDTH - 24, 10.5, true);

    // Compute needed card height
    let cardHeight = 34 + promptLines.length * 15 + 10;
    if (q.type === "blank") {
      cardHeight += 38;
    } else if (q.options && q.options.length > 0) {
      cardHeight += q.options.length * 20 + 8;
    }

    ensureSpace(cardHeight + 12);

    const cardTop = cursorY;
    const cardBottom = cursorY - cardHeight;

    // Card background & border
    if (isCorrect) {
      currentPageStream += `
        0.96 0.99 0.97 rg
        ${MARGIN_LEFT} ${cardBottom} ${CONTENT_WIDTH} ${cardHeight} re f
        0.65 0.85 0.70 RG
        1 w
        ${MARGIN_LEFT} ${cardBottom} ${CONTENT_WIDTH} ${cardHeight} re S
      `;
    } else {
      currentPageStream += `
        0.99 0.96 0.96 rg
        ${MARGIN_LEFT} ${cardBottom} ${CONTENT_WIDTH} ${cardHeight} re f
        0.90 0.70 0.70 RG
        1 w
        ${MARGIN_LEFT} ${cardBottom} ${CONTENT_WIDTH} ${cardHeight} re S
      `;
    }

    // Question header line (Question #1 · Multiple Choice ... Correct/Incorrect badge)
    currentPageStream += `
      BT
      /F2 10 Tf
      0.20 0.28 0.49 rg
      1 0 0 1 ${MARGIN_LEFT + 12} ${cardTop - 18} Tm
      (Question #${index + 1}  ·  ${typeLabel}) Tj
    `;

    if (isCorrect) {
      currentPageStream += `
        /F2 9.5 Tf
        0.10 0.55 0.25 rg
        1 0 0 1 ${MARGIN_LEFT + CONTENT_WIDTH - 120} ${cardTop - 18} Tm
        ([✓ Correct  +100 pts]) Tj
      `;
    } else {
      currentPageStream += `
        /F2 9.5 Tf
        0.80 0.20 0.20 rg
        1 0 0 1 ${MARGIN_LEFT + CONTENT_WIDTH - 120} ${cardTop - 18} Tm
        ([✗ Missed  +0 pts]) Tj
      `;
    }

    // Render Prompt lines
    let textY = cardTop - 34;
    currentPageStream += `
      /F2 10.5 Tf
      0.12 0.15 0.25 rg
    `;
    promptLines.forEach((line) => {
      currentPageStream += `
        1 0 0 1 ${MARGIN_LEFT + 12} ${textY} Tm
        (${escapePdfText(line)}) Tj
      `;
      textY -= 15;
    });

    textY -= 4;

    // Options or Blank answers
    if (q.type === "blank") {
      currentPageStream += `
        /F1 9 Tf
        0.40 0.40 0.45 rg
        1 0 0 1 ${MARGIN_LEFT + 12} ${textY} Tm
        (Your Answer: ) Tj
        /F2 9.5 Tf
        ${isCorrect ? "0.10 0.55 0.25 rg" : "0.80 0.20 0.20 rg"}
        1 0 0 1 ${MARGIN_LEFT + 80} ${textY} Tm
        ("${escapePdfText(userAns || "(Left blank)")}") Tj

        /F1 9 Tf
        0.10 0.55 0.25 rg
        1 0 0 1 ${MARGIN_LEFT + 280} ${textY} Tm
        (Correct Answer: ) Tj
        /F2 9.5 Tf
        1 0 0 1 ${MARGIN_LEFT + 360} ${textY} Tm
        ("${escapePdfText(q.answer)}") Tj
      `;
    } else if (q.options) {
      q.options.forEach((opt, optIdx) => {
        const isChosen = userAns === opt;
        const isTheCorrectAnswer = opt === q.answer;
        const letter = String.fromCharCode(65 + optIdx);

        let optColor = "0.25 0.25 0.30 rg";
        let fontType = "/F1 9.5 Tf";
        let badgeText = "";

        if (isChosen && isTheCorrectAnswer) {
          optColor = "0.10 0.55 0.25 rg";
          fontType = "/F2 9.5 Tf";
          badgeText = "  ✓ (Your Answer - Correct)";
        } else if (isChosen && !isTheCorrectAnswer) {
          optColor = "0.80 0.20 0.20 rg";
          fontType = "/F2 9.5 Tf";
          badgeText = "  ✗ (Your Answer)";
        } else if (isTheCorrectAnswer) {
          optColor = "0.10 0.55 0.25 rg";
          fontType = "/F2 9.5 Tf";
          badgeText = "  ✓ (Correct Answer)";
        }

        const optText = `${letter}. ${opt}${badgeText}`;
        const truncatedOpt = truncatePdfText(optText, CONTENT_WIDTH - 28, 9.5);

        currentPageStream += `
          ${fontType}
          ${optColor}
          1 0 0 1 ${MARGIN_LEFT + 16} ${textY} Tm
          (${escapePdfText(truncatedOpt)}) Tj
        `;
        textY -= 18;
      });
    }

    currentPageStream += `
      ET
    `;

    cursorY = cardBottom - 12;
  });

  // Push final page
  pages.push(currentPageStream);

  // --- Assemble Full PDF File ---
  return assemblePdf(pages, PAGE_WIDTH, PAGE_HEIGHT, MARGIN_LEFT, CONTENT_WIDTH);
}

/**
 * Escapes special PDF characters in literal strings.
 */
function escapePdfText(str: string): string {
  return (str || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\r\n\t]/g, " ");
}

/**
 * Wraps text into lines that fit within maxWidth points.
 */
function wrapText(text: string, maxWidth: number, fontSize: number, isBold: boolean): string[] {
  const avgCharWidth = fontSize * (isBold ? 0.56 : 0.52);
  const maxChars = Math.floor(maxWidth / avgCharWidth);

  const words = (text || "").split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxChars) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text];
}

/**
 * Truncates text if it exceeds maxWidth.
 */
function truncatePdfText(text: string, maxWidth: number, fontSize: number): string {
  const avgCharWidth = fontSize * 0.54;
  const maxChars = Math.floor(maxWidth / avgCharWidth);
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3) + "...";
}

/**
 * Encodes pages into a standard PDF 1.4 document format with cross-reference table.
 */
function assemblePdf(
  pages: string[],
  pageWidth: number,
  pageHeight: number,
  marginLeft: number,
  contentWidth: number,
): Blob {
  const totalPages = pages.length;
  const objects: string[] = [];

  // Obj 1: Catalog
  // Obj 2: Pages container
  // Obj 3..N: Page objects
  // Obj N+1..2N: Page content stream objects
  // Obj 2N+1: Font F1 (Helvetica)
  // Obj 2N+2: Font F2 (Helvetica-Bold)
  // Obj 2N+3: Font F3 (Helvetica-Oblique)

  const fontF1Id = 3 + totalPages * 2;
  const fontF2Id = fontF1Id + 1;
  const fontF3Id = fontF1Id + 2;

  // Obj 1: Catalog
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  // Obj 2: Pages
  const kids = Array.from({ length: totalPages }, (_, i) => `${3 + i} 0 R`).join(" ");
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${totalPages} >>\nendobj\n`);

  // Page objects and Stream objects
  for (let i = 0; i < totalPages; i++) {
    const pageObjId = 3 + i;
    const contentObjId = 3 + totalPages + i;
    const pageNum = i + 1;

    // Append footer to content stream
    const pageStreamWithFooter = `
      ${pages[i]}
      BT
      0.70 0.70 0.75 RG
      0.5 w
      ${marginLeft} 34 m ${marginLeft + contentWidth} 34 l S
      /F1 8.5 Tf
      0.50 0.50 0.55 rg
      1 0 0 1 ${marginLeft} 22 Tm
      (Quizster Study Guide   ·   Keep racing, keep learning!) Tj
      1 0 0 1 ${marginLeft + contentWidth - 65} 22 Tm
      (Page ${pageNum} of ${totalPages}) Tj
      ET
    `.trim();

    // Page object
    objects.push(
      `${pageObjId} 0 obj\n<<\n  /Type /Page\n  /Parent 2 0 R\n  /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}]\n  /Contents ${contentObjId} 0 R\n  /Resources <<\n    /Font <<\n      /F1 ${fontF1Id} 0 R\n      /F2 ${fontF2Id} 0 R\n      /F3 ${fontF3Id} 0 R\n    >>\n  >>\n>>\nendobj\n`,
    );

    // Stream object
    const streamBytes = new TextEncoder().encode(pageStreamWithFooter);
    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${pageStreamWithFooter}\nendstream\nendobj\n`,
    );
  }

  // Fonts
  objects.push(`${fontF1Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);
  objects.push(
    `${fontF2Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`,
  );
  objects.push(
    `${fontF3Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n`,
  );

  // Compute xref offsets
  const header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  let offset = header.length;
  const offsets: number[] = [0]; // obj 0 is dummy

  for (const obj of objects) {
    offsets.push(offset);
    offset += obj.length;
  }

  // Cross reference table
  let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;

  const fullPdf = header + objects.join("") + xref + trailer;
  return new Blob([fullPdf], { type: "application/pdf" });
}
