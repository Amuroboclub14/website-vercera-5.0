"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";

export type AdminLevel = "owner" | "super_admin" | "event_admin";

async function checkAdmin(
  getToken: (forceRefresh?: boolean) => Promise<string>,
  forceRefresh = false
): Promise<Response> {
  const token = await getToken(forceRefresh);
  return fetch("/api/admin/check", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [level, setLevel] = useState<AdminLevel | null>(null);

  useEffect(() => {
    if (!user || authLoading) {
      setAdminChecked(false);
      setIsAdmin(false);
      setLevel(null);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        // Force refresh token so server gets a valid one (avoids stale/expired token)
        const res = await checkAdmin(user.getIdToken.bind(user), true);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (data.ok) {
            setAdminChecked(true);
            setIsAdmin(true);
            setLevel(data.level ?? null);
            return;
          }
        }
        // On 401, retry once with a fresh token (no force refresh this time to avoid loop)
        if (res.status === 401) {
          const retryRes = await checkAdmin(user.getIdToken.bind(user), false);
          if (cancelled) return;
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            if (cancelled) return;
            if (retryData.ok) {
              setAdminChecked(true);
              setIsAdmin(true);
              setLevel(retryData.level ?? null);
              return;
            }
          }
        }
        setAdminChecked(true);
        setIsAdmin(false);
        setLevel(null);
      } catch {
        if (!cancelled) {
          setAdminChecked(true);
          setIsAdmin(false);
          setLevel(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return {
    isAdmin,
    level,
    adminChecked: adminChecked && !authLoading,
    loading: authLoading || (!!user && !adminChecked),
  };
}
