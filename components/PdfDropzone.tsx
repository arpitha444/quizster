"use client";

import { useState } from "react";
import { Button } from "./Button";

type Props = {
  file: File | null;
  onFile: (file: File | null) => void;
};

export function PdfDropzone({ file, onFile }: Props) {
  const [error, setError] = useState("");

  function takeFile(next: File | null) {
    setError("");
    if (!next) {
      onFile(null);
      return;
    }
    if (next.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    if (next.size > 8 * 1024 * 1024) {
      setError("That PDF is over 8MB. Try a smaller file.");
      return;
    }
    onFile(next);
  }

  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border-4 border-dashed border-french/30 bg-white px-6 py-12 text-center shadow-card">
      <div className="text-4xl">✦</div>
      <p className="mt-3 text-lg font-extrabold text-midnight">Drop your notes PDF here</p>
      <p className="mt-1 text-sm text-midnight/70">or click to browse · max 8MB</p>
      {file ? (
        <p className="mt-4 rounded-full bg-wheat px-4 py-2 text-sm font-bold text-midnight">{file.name}</p>
      ) : null}
      {error ? <p className="mt-3 text-sm font-bold text-red-700">{error}</p> : null}
      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => takeFile(event.target.files?.[0] ?? null)}
      />
      {file ? (
        <Button
          type="button"
          variant="ghost"
          className="mt-4"
          onClick={(event) => {
            event.preventDefault();
            takeFile(null);
          }}
        >
          Clear file
        </Button>
      ) : null}
    </label>
  );
}
