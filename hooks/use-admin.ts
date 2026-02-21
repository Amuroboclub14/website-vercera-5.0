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
  const [bootstrapOwnerUid, setBootstrapOwnerUid] = useState<string | null>(null);

  useEffect(() => {
    if (!user || authLoading) {
      setAdminChecked(false);
      setIsAdmin(false);
      setLevel(null);
      setBootstrapOwnerUid(null);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const res = await checkAdmin(user.getIdToken.bind(user), true);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (data.ok) {
            setAdminChecked(true);
            setIsAdmin(true);
            setLevel(data.level ?? null);
            setBootstrapOwnerUid(data.bootstrapOwnerUid ?? null);
            return;
          }
        }
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
              setBootstrapOwnerUid(retryData.bootstrapOwnerUid ?? null);
              return;
            }
          }
        }
        setAdminChecked(true);
        setIsAdmin(false);
        setLevel(null);
        setBootstrapOwnerUid(null);
      } catch {
        if (!cancelled) {
          setAdminChecked(true);
          setIsAdmin(false);
          setLevel(null);
          setBootstrapOwnerUid(null);
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
    bootstrapOwnerUid,
    adminChecked: adminChecked && !authLoading,
    loading: authLoading || (!!user && !adminChecked),
  };
}
