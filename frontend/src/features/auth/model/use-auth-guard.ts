"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getToken } from "@/src/shared/lib/auth-token";
import { decodeJwtPayload } from "@/src/shared/lib/jwt";

// Pages that don't require authentication
const PUBLIC_PATHS = ["/login", "/report", "/select-project"];

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    const token = getToken();

    if (!token) {
      // Not authenticated → go to login (unless already there)
      if (!isPublicPath) {
        router.replace("/login");
      }
      return;
    }

    const payload = decodeJwtPayload(token);

    // Token expired check
    if (payload?.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("vigil_token");
      if (!isPublicPath) {
        router.replace("/login");
      }
      return;
    }

    // Authenticated but on login page → redirect to dashboard
    if (pathname === "/login") {
      if (payload?.project_id) {
        router.replace("/");
      } else {
        router.replace("/select-project");
      }
      return;
    }

    // Authenticated but no project selected → go to project selector
    // (except if already on select-project or other public paths)
    if (!payload?.project_id && !isPublicPath) {
      router.replace("/select-project");
    }
  }, [pathname, router]);
}
