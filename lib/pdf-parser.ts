import zlib from "zlib";

/**
 * Extracts plain text from a PDF Buffer without external dependencies.
 * Decompresses FlateDecode streams using Node.js built-in zlib and
 * parses standard PDF text operators (Tj, TJ, ', ").
 */
export function extractTextFromPdf(pdfBuffer: Buffer): string {
  const binary = pdfBuffer.toString("binary");
  const extractedPieces: string[] = [];

  // Match all streams in the PDF
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(binary)) !== null) {
    const rawStream = match[1];
    let streamText = "";

    // 1. Try decompressing with zlib (FlateDecode)
    try {
      const buf = Buffer.from(rawStream, "binary");
      const inflated = zlib.inflateSync(buf);
      streamText = inflated.toString("binary");
    } catch {
      try {
        const buf = Buffer.from(rawStream, "binary");
        const inflated = zlib.inflateRawSync(buf);
        streamText = inflated.toString("binary");
      } catch {
        // Uncompressed or other encoding
        streamText = rawStream;
      }
    }

    if (!streamText) continue;

    // 2. Extract text from the stream content
    const textInStream = parsePdfStreamText(streamText);
    if (textInStream.trim()) {
      extractedPieces.push(textInStream.trim());
    }
  }

  // Fallback: If no text was found in streams, inspect binary for plain Tj operators
  if (extractedPieces.length === 0) {
    const fallback = parsePdfStreamText(binary);
    if (fallback.trim()) {
      extractedPieces.push(fallback.trim());
    }
  }

  // Join pieces and clean whitespace
  const fullText = extractedPieces
    .join("\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return fullText;
}

/**
 * Parses text drawing operators from a decompressed PDF content stream:
 * - (string) Tj
 * - (string) '
 * - (string) "
 * - [(array)...] TJ
 * - <hex> Tj
 */
function parsePdfStreamText(stream: string): string {
  const lines: string[] = [];

  // Match TJ arrays: [(text) 20 (more text)] TJ or [<0041> 10 <0042>] TJ
  const tjArrayRegex = /\[([\s\S]*?)\]\s*TJ/g;
  let arrayMatch: RegExpExecArray | null;

  while ((arrayMatch = tjArrayRegex.exec(stream)) !== null) {
    const rawArray = arrayMatch[1];
    let reconstructed = "";

    // Extract all parenthesis strings (text)
    const parenRegex = /\(((?:\\\(|\\\)|[^)])*)\)/g;
    let parenMatch: RegExpExecArray | null;
    while ((parenMatch = parenRegex.exec(rawArray)) !== null) {
      reconstructed += decodePdfString(parenMatch[1]);
    }

    // Also extract hex strings <...>
    if (!reconstructed) {
      const hexRegex = /<([0-9a-fA-F]+)>/g;
      let hexMatch: RegExpExecArray | null;
      while ((hexMatch = hexRegex.exec(rawArray)) !== null) {
        reconstructed += decodeHexPdfString(hexMatch[1]);
      }
    }

    if (reconstructed.trim()) {
      lines.push(reconstructed.trim());
    }
  }

  // Match single string operators: (string) Tj, (string) ', (string) "
  const tjRegex = /\(((?:\\\(|\\\)|[^)])*)\)\s*(?:Tj|'|")/g;
  let tjMatch: RegExpExecArray | null;

  while ((tjMatch = tjRegex.exec(stream)) !== null) {
    const decoded = decodePdfString(tjMatch[1]);
    if (decoded.trim()) {
      lines.push(decoded.trim());
    }
  }

  // Match hex string operators: <hex> Tj
  const hexTjRegex = /<([0-9a-fA-F]+)>\s*(?:Tj|'|")/g;
  let hexTjMatch: RegExpExecArray | null;

  while ((hexTjMatch = hexTjRegex.exec(stream)) !== null) {
    const decoded = decodeHexPdfString(hexTjMatch[1]);
    if (decoded.trim()) {
      lines.push(decoded.trim());
    }
  }

  return lines.join(" ");
}

/**
 * Decodes literal PDF strings, handling escape sequences and octal codes.
 */
function decodePdfString(str: string): string {
  return str
    .replace(/\\([()\\])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

/**
 * Decodes hexadecimal PDF strings (e.g., <48656C6C6F> -> "Hello").
 * Handles both ASCII and 2-byte UTF-16BE encodings.
 */
function decodeHexPdfString(hex: string): string {
  // If odd length, pad with 0
  const cleanHex = hex.length % 2 !== 0 ? hex + "0" : hex;

  // Check for UTF-16BE BOM: FEFF
  if (cleanHex.toUpperCase().startsWith("FEFF")) {
    let result = "";
    for (let i = 4; i < cleanHex.length; i += 4) {
      const code = parseInt(cleanHex.substring(i, i + 4), 16);
      if (!isNaN(code) && code > 0) {
        result += String.fromCharCode(code);
      }
    }
    return result;
  }

  // Standard ASCII / single-byte hex
  let result = "";
  for (let i = 0; i < cleanHex.length; i += 2) {
    const code = parseInt(cleanHex.substring(i, i + 2), 16);
    // Printable characters or common whitespace
    if (code >= 32 && code <= 126) {
      result += String.fromCharCode(code);
    } else if (code === 10 || code === 13 || code === 9) {
      result += " ";
    }
  }
  return result;
}
