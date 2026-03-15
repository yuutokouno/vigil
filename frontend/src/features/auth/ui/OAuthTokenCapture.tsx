"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/src/shared/lib/auth-token";
import { decodeJwtPayload } from "@/src/shared/lib/jwt";

// Inner component uses useSearchParams — must live inside a <Suspense> boundary
function TokenCaptureInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) return;

    setToken(token);
    const payload = decodeJwtPayload(token);
    router.replace(payload?.project_id ? "/" : "/select-project");
  }, [searchParams, router]);

  return null;
}

// Wraps the inner component in Suspense so it can safely use useSearchParams
export function OAuthTokenCapture() {
  return (
    <Suspense fallback={null}>
      <TokenCaptureInner />
    </Suspense>
  );
}
