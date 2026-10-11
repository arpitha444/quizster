"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { UserProfileModal } from "./UserProfileModal";

type ProfileModalContextValue = {
  openProfile: (uid: string, fallback?: { name?: string; avatarId?: string }) => void;
  closeProfile: () => void;
};

const ProfileModalContext = createContext<ProfileModalContextValue | null>(null);

export function ProfileModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [fallbackName, setFallbackName] = useState<string | undefined>();
  const [fallbackAvatarId, setFallbackAvatarId] = useState<string | undefined>();

  function openProfile(uid: string, fallback?: { name?: string; avatarId?: string }) {
    setActiveUid(uid);
    setFallbackName(fallback?.name);
    setFallbackAvatarId(fallback?.avatarId);
    setIsOpen(true);
  }

  function closeProfile() {
    setIsOpen(false);
    setActiveUid(null);
  }

  return (
    <ProfileModalContext.Provider value={{ openProfile, closeProfile }}>
      {children}
      <UserProfileModal
        isOpen={isOpen}
        onClose={closeProfile}
        userId={activeUid}
        fallbackName={fallbackName}
        fallbackAvatarId={fallbackAvatarId}
      />
    </ProfileModalContext.Provider>
  );
}

export function useProfileModal() {
  const context = useContext(ProfileModalContext);
  if (!context) {
    throw new Error("useProfileModal must be used within ProfileModalProvider");
  }
  return context;
}
