import Image from "next/image";
import Link from "next/link";
import { HomeRedirect } from "@/components/HomeRedirect";

export default function LandingPage() {
  return (
    <div className="grid items-center gap-10 py-8 lg:grid-cols-2">
      <HomeRedirect />
      <div>
        <p className="inline-flex rounded-full bg-wheat px-4 py-1 text-sm font-extrabold uppercase tracking-wide text-midnight">
          Learn faster, together
        </p>
        <h1 className="mt-4 text-4xl font-black leading-tight text-midnight sm:text-5xl">
          Turn class PDFs into a live quiz race.
        </h1>
        <p className="mt-4 max-w-md text-lg font-semibold text-midnight/75">
          Upload notes, let Google&apos;s Gemini Flash write mixed questions, then race your friends with a room
          code. First high score wins.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-french px-6 py-3 font-extrabold text-white shadow-bubble"
          >
            Create an account
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-white px-6 py-3 font-extrabold text-midnight shadow-card"
          >
            I already have one
          </Link>
        </div>
      </div>
      <div className="rounded-[2.5rem] bg-white p-8 shadow-card">
        <Image
          src="/quizster-poster.png"
          alt="Quizster poster"
          width={420}
          height={160}
          className="mx-auto"
        />
        <ul className="mt-8 space-y-3 font-bold text-midnight">
          <li className="rounded-2xl bg-seashell px-4 py-3">1. Drop a PDF of notes</li>
          <li className="rounded-2xl bg-seashell px-4 py-3">2. AI builds MCQ, true/false, and blanks</li>
          <li className="rounded-2xl bg-seashell px-4 py-3">3. Share a 6-letter code and race</li>
        </ul>
      </div>
    </div>
  );
}
