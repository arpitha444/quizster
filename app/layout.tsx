import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Header } from "@/components/Header";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "800", "900"],
});

export const metadata: Metadata = {
  title: "Quizster",
  description: "Turn PDFs into live quiz races with friends.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${nunito.className} min-h-screen antialiased`}>
        <AuthProvider>
          <Header />
          <main className="mx-auto w-full max-w-5xl px-4 pb-16">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
