"use client";

import type { User } from "@/src/entities/user/model/types";

type UserAvatarProps = {
  user: User;
  size?: number;
};

export function UserAvatar({ user, size = 32 }: UserAvatarProps) {
  return (
    <img
      src={
        user.avatar_url ??
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`
      }
      alt={user.name}
      width={size}
      height={size}
      className="rounded-full"
    />
  );
}
