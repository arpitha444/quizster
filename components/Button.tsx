import { clsx } from "./cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "wheat";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    primary: "bg-french text-white shadow-bubble hover:-translate-y-0.5",
    secondary: "bg-white text-midnight shadow-card hover:-translate-y-0.5",
    ghost: "bg-powder/40 text-midnight hover:bg-powder/70",
    wheat: "bg-wheat text-midnight shadow-card hover:-translate-y-0.5",
  };

  return (
    <button
      className={clsx(
        "rounded-full px-5 py-2.5 font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
