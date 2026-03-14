const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type PublicBugCreate = {
  title: string;
  description?: string | null;
  steps_to_reproduce?: string | null;
  environment?: string | null;
  severity?: "critical" | "high" | "medium" | "low";
};

export type PublicBugResponse = {
  id: string;
  bug_number: string; // formatted as VIGIL-XXXX
};

export async function createPublicBug(data: PublicBugCreate): Promise<PublicBugResponse> {
  const response = await fetch(`${BASE_URL}/api/public/bugs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail ?? "送信に失敗しました");
  }

  return response.json();
}
