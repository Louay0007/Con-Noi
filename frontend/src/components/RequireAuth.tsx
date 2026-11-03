import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api, type ApiError } from "@/lib/api";

/**
 * Route guard for signed-in screens. The API is the only source of truth:
 * an HttpOnly cookie cannot be inspected from JS, so the guard asks /auth/me.
 *
 * A 401 sends the visitor to the login screen and remembers where they were
 * going; a 429 (login throttle) is not an auth failure, so it retries rather
 * than bouncing a signed-in user to the login form.
 */
export default function RequireAuth({ adminOnly = false }: { adminOnly?: boolean }) {
  const location = useLocation();
  const [state, setState] = useState<"checking" | "in" | "out" | "forbidden">("checking");

  useEffect(() => {
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const check = async (attempt = 0) => {
      try {
        const user = await api.getMe();
        if (cancelled) return;
        // The API also enforces this; bouncing here avoids a page of 403s.
        if (adminOnly && user.role !== "admin") {
          setState("forbidden");
          return;
        }
        setState("in");
      } catch (err) {
        if (cancelled) return;
        const { statusCode } = err as ApiError;
        if (statusCode === 429 && attempt < 3) {
          retry = setTimeout(() => void check(attempt + 1), 2000);
          return;
        }
        setState("out");
      }
    };

    void check();
    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
    };
  }, [adminOnly]);

  if (state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="size-8 animate-spin text-[#0F4C81]" aria-label="Caricamento" />
      </div>
    );
  }

  if (state === "forbidden") {
    return <Navigate to="/for-you" replace />;
  }

  if (state === "out") {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to="/auth/login" replace state={{ from: redirect }} />;
  }

  return <Outlet />;
}
