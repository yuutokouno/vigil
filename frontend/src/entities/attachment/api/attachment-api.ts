import { getToken } from "@/src/shared/lib/auth-token";
import type { Attachment } from "../model/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function listAttachments(bugId: string): Promise<Attachment[]> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/api/bugs/${bugId}/attachments`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch attachments");
  return res.json();
}

export async function uploadAttachment(
  bugId: string,
  file: File,
): Promise<Attachment> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/api/bugs/${bugId}/attachments`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Upload failed");
  }
  return res.json();
}
