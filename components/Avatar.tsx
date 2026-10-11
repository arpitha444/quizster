"use client";

import Image from "next/image";
import { getAvatar } from "@/lib/avatars";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_CONFIG: Record<AvatarSize, { box: string; px: number }> = {
  xs: { box: "h-6 w-6", px: 24 },
  sm: { box: "h-8 w-8", px: 32 },
  md: { box: "h-11 w-11", px: 44 },
  lg: { box: "h-16 w-16", px: 64 },
  xl: { box: "h-24 w-24", px: 96 },
  "2xl": { box: "h-32 w-32", px: 128 },
};

export function Avatar({
  id,
  size = "md",
  className = "",
  showRing = false,
  alt,
}: {
  id?: string | null;
  size?: AvatarSize;
  className?: string;
  showRing?: boolean;
  alt?: string;
}) {
  const avatar = getAvatar(id);
  const cfg = SIZE_CONFIG[size];

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${cfg.box} ${
        avatar.bgColor
      } ${showRing ? `ring-2 ring-offset-2 ${avatar.ringColor}` : ""} ${className}`}
    >
      <Image
        src={avatar.src}
        alt={alt || avatar.name}
        width={cfg.px}
        height={cfg.px}
        className="h-full w-full object-contain p-0.5 transition-transform duration-200"
      />
    </div>
  );
}
