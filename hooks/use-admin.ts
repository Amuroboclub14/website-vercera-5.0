"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";

export type AdminLevel = "owner" | "super_admin" | "event_admin";

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
    user
      .getIdToken()
      .then((token) => {
        if (cancelled) return;
        return fetch("/api/admin/check", {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then(async (res) => {
        if (cancelled) return;
        setAdminChecked(true);
        if (res?.ok) {
          const data = await res.json();
          setIsAdmin(true);
          setLevel(data.level ?? null);
        } else {
          setIsAdmin(false);
          setLevel(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAdminChecked(true);
          setIsAdmin(false);
          setLevel(null);
        }
      });
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
