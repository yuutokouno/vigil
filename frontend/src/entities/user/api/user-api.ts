import { apiClient } from "@/src/shared/api/client";
import type { User } from "@/src/entities/user/model/types";

export async function getMe(): Promise<User> {
  return apiClient<User>("/api/auth/me");
}

export async function listUsers(): Promise<User[]> {
  return apiClient<User[]>("/api/users");
}
