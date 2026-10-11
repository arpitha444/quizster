"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { AVATAR_OPTIONS, type AvatarId } from "@/lib/avatars";
import { useAuth } from "@/lib/auth-context";
import type { UserProfile } from "@/lib/types";
import { getDefaultProfile, getUserProfile } from "@/lib/user-profile";

export function UserProfileModal({
  isOpen,
  onClose,
  userId,
  fallbackName,
  fallbackAvatarId,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  fallbackName?: string;
  fallbackAvatarId?: string;
}) {
  const { user, profile: myProfile, updateProfileData } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatarId, setEditAvatarId] = useState<AvatarId>("yellow");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isMe = Boolean(user && userId && user.uid === userId);

  useEffect(() => {
    if (!isOpen || !userId) {
      setProfileData(null);
      setIsEditing(false);
      return;
    }

    if (isMe && myProfile) {
      setProfileData(myProfile);
      setEditName(myProfile.displayName);
      setEditBio(myProfile.bio || "");
      setEditAvatarId(myProfile.avatarId);
      return;
    }

    // Otherwise fetch the target user's profile
    setLoading(true);
    getUserProfile(userId)
      .then((data) => {
        if (data) {
          setProfileData(data);
        } else {
          setProfileData({
            ...getDefaultProfile(userId, fallbackName || "Racer"),
            avatarId: (fallbackAvatarId as AvatarId) || "yellow",
          });
        }
      })
      .catch(() => {
        setProfileData({
          ...getDefaultProfile(userId, fallbackName || "Racer"),
          avatarId: (fallbackAvatarId as AvatarId) || "yellow",
        });
      })
      .finally(() => setLoading(false));
  }, [isOpen, userId, isMe, myProfile, fallbackName, fallbackAvatarId]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !userId) return null;

  async function handleSaveEdit() {
    if (!editName.trim()) {
      setErrorMsg("Display name cannot be empty.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      await updateProfileData({
        displayName: editName.trim(),
        bio: editBio.trim(),
        avatarId: editAvatarId,
      });
      setIsEditing(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  const displayedProfile = isMe ? myProfile || profileData : profileData;
  const currentAvatarId = displayedProfile?.avatarId || (fallbackAvatarId as AvatarId) || "yellow";
  const currentDisplayName = displayedProfile?.displayName || fallbackName || "Player";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-midnight/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-card border-4 border-wheat/60">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close profile"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-seashell text-lg font-black text-midnight/70 transition hover:bg-wheat hover:text-midnight active:scale-95 shadow-sm"
        >
          ✕
        </button>

        {/* Scrollable Inner Area with hidden scrollbar */}
        <div className="overflow-y-auto p-5 sm:p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {loading ? (
            <div className="py-16 text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-french border-t-transparent" />
              <p className="mt-4 font-bold text-midnight/70">Loading profile…</p>
            </div>
          ) : isEditing ? (
          /* =================== EDIT MODE (CURRENT USER ONLY) =================== */
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-black text-midnight">Edit Profile</h2>
              <p className="text-xs sm:text-sm font-semibold text-midnight/60">
                Customize your racer look and bio
              </p>
            </div>

            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-french mb-2">
                Choose Your Avatar
              </label>
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {AVATAR_OPTIONS.map((option) => {
                  const selected = editAvatarId === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setEditAvatarId(option.id)}
                      className={`group flex flex-col items-center rounded-2xl p-2 transition-all ${
                        selected
                          ? "bg-wheat/70 scale-105 ring-4 ring-french shadow-md"
                          : "bg-seashell hover:bg-wheat/40 active:scale-95"
                      }`}
                    >
                      <Avatar id={option.id} size="md" />
                      <span className="mt-1 truncate text-[10px] font-black text-midnight">
                        {option.name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Username / Display Name Input */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-french mb-1">
                Display Name
              </label>
              <input
                type="text"
                maxLength={30}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Racer username"
                className="w-full rounded-2xl border-2 border-midnight/15 bg-seashell px-4 py-2.5 font-extrabold text-midnight outline-none focus:border-french"
              />
            </div>

            {/* Bio Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-black uppercase tracking-wider text-french">
                  Bio
                </label>
                <span className="text-xs font-bold text-midnight/50">
                  {editBio.length}/160
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={160}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell other racers a little something about you…"
                className="w-full resize-none rounded-2xl border-2 border-midnight/15 bg-seashell px-4 py-2.5 font-semibold text-midnight outline-none focus:border-french text-sm"
              />
            </div>

            {errorMsg ? (
              <p className="rounded-xl bg-red-50 p-2.5 text-center text-xs font-extrabold text-red-700 border border-red-200">
                {errorMsg}
              </p>
            ) : null}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1"
              >
                {saving ? "Saving…" : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="wheat"
                onClick={() => {
                  setIsEditing(false);
                  setErrorMsg("");
                  if (displayedProfile) {
                    setEditName(displayedProfile.displayName);
                    setEditBio(displayedProfile.bio || "");
                    setEditAvatarId(displayedProfile.avatarId);
                  }
                }}
                disabled={saving}
                className="px-5"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* =================== VIEW MODE =================== */
          <div className="space-y-4">
            {/* Header info: Avatar, Name, Bio */}
            <div className="flex flex-col items-center text-center">
              <Avatar id={currentAvatarId} size="lg" showRing />

              <div className="mt-2.5 flex items-center gap-2">
                <h2 className="text-2xl font-black text-midnight">
                  {currentDisplayName}
                </h2>
                {isMe ? (
                  <span className="rounded-full bg-french/10 px-2 py-0.5 text-[10px] font-black text-french uppercase tracking-wider">
                    You
                  </span>
                ) : null}
              </div>

              {/* Bio */}
              <p className="mt-1 max-w-xs text-xs sm:text-sm font-semibold text-midnight/70 italic">
                {displayedProfile?.bio?.trim()
                  ? `“${displayedProfile.bio}”`
                  : "No bio yet."}
              </p>
            </div>

            {/* Streaks & Stats Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Correct Answer Streak Card */}
              <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/70 p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-amber-600">
                  <span className="text-base">🔥</span>
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    Correct Streak
                  </span>
                </div>
                <p className="mt-0.5 text-2xl font-black text-amber-700">
                  {displayedProfile?.correctStreak ?? 0}
                </p>
                <p className="text-[10px] font-bold text-amber-800/70">
                  Best streak: {displayedProfile?.bestCorrectStreak ?? 0}
                </p>
              </div>

              {/* Group Quiz Win Streak Card */}
              <div className="rounded-2xl border-2 border-french/20 bg-french/5 p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-french">
                  <span className="text-base">🏆</span>
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    Group Win Streak
                  </span>
                </div>
                <p className="mt-0.5 text-2xl font-black text-french">
                  {displayedProfile?.groupWinStreak ?? 0}
                </p>
                <p className="text-[10px] font-bold text-french/70">
                  Best streak: {displayedProfile?.bestGroupWinStreak ?? 0}
                </p>
              </div>

              {/* Total Group Wins */}
              <div className="rounded-2xl border-2 border-midnight/10 bg-seashell p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-midnight/80">
                  <span className="text-sm">🥇</span>
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    Group Wins
                  </span>
                </div>
                <p className="mt-0.5 text-xl font-black text-midnight">
                  {displayedProfile?.totalGroupWins ?? 0}
                </p>
                <p className="text-[10px] font-bold text-midnight/50">
                  1st place finishes
                </p>
              </div>

              {/* Total Quizzes Played */}
              <div className="rounded-2xl border-2 border-midnight/10 bg-seashell p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-midnight/80">
                  <span className="text-sm">🎮</span>
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    Quizzes Played
                  </span>
                </div>
                <p className="mt-0.5 text-xl font-black text-midnight">
                  {displayedProfile?.totalQuizzesPlayed ?? 0}
                </p>
                <p className="text-[10px] font-bold text-midnight/50">
                  Races completed
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-center gap-3 pt-1">
              {isMe ? (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full"
                >
                  Edit Profile
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="wheat"
                  onClick={onClose}
                  className="w-full"
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
