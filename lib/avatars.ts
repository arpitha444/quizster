export type AvatarId = "yellow" | "orange" | "purple" | "teal" | "pink";

export interface AvatarOption {
  id: AvatarId;
  name: string;
  src: string;
  bgColor: string;
  ringColor: string;
}

export const AVATAR_OPTIONS: readonly AvatarOption[] = [
  {
    id: "yellow",
    name: "Sunny Blob",
    src: "/avatars/yellow.png",
    bgColor: "bg-amber-100",
    ringColor: "ring-amber-400",
  },
  {
    id: "orange",
    name: "Star Spark",
    src: "/avatars/orange.png",
    bgColor: "bg-orange-100",
    ringColor: "ring-orange-400",
  },
  {
    id: "purple",
    name: "Petal Bloom",
    src: "/avatars/purple.png",
    bgColor: "bg-purple-100",
    ringColor: "ring-purple-400",
  },
  {
    id: "teal",
    name: "Aqua Splash",
    src: "/avatars/teal.png",
    bgColor: "bg-teal-100",
    ringColor: "ring-teal-400",
  },
  {
    id: "pink",
    name: "Rosy Archie",
    src: "/avatars/pink.png",
    bgColor: "bg-pink-100",
    ringColor: "ring-pink-400",
  },
] as const;

export const DEFAULT_AVATAR_ID: AvatarId = "yellow";

export function getAvatar(id?: string | null): AvatarOption {
  if (!id) return AVATAR_OPTIONS[0];
  const found = AVATAR_OPTIONS.find((a) => a.id === id);
  return found ?? AVATAR_OPTIONS[0];
}
