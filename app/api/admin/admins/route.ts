import { NextRequest, NextResponse } from "next/server";
import { getVerceraFirestore } from "@/lib/firebase-admin";
import { requireAdminLevel } from "@/lib/admin-auth";
import type { AdminLevel } from "@/lib/admin-auth";

const ALLOWED_LEVELS: AdminLevel[] = ["owner", "super_admin"];

/** GET: List admin roles. Owner sees all; super_admin sees only event_admins. */
export async function GET(request: NextRequest) {
  const auth = await requireAdminLevel(request, ALLOWED_LEVELS);
  if (auth instanceof NextResponse) return auth;
  try {
    const db = getVerceraFirestore();
    const snapshot = await db.collection("admin_roles").get();
    let list = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        userId: doc.id,
        role: d.role as "super_admin" | "event_admin",
        email: d.email ?? null,
        fullName: d.fullName ?? null,
        addedAt: d.addedAt ?? null,
      };
    });
    if (auth.level === "super_admin") {
      list = list.filter((a) => a.role === "event_admin");
    }
    return NextResponse.json({ admins: list });
  } catch (err) {
    console.error("Admin list error:", err);
    return NextResponse.json(
      { error: "Failed to list admins" },
      { status: 500 },
    );
  }
}

/** POST: Set or remove admin role for a participant (by userId). Only owner can set super_admin. */
export async function POST(request: NextRequest) {
  const auth = await requireAdminLevel(request, ALLOWED_LEVELS);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const { userId, role } = body as {
      userId?: string;
      role?: "super_admin" | "event_admin" | null;
    };
    if (!userId || typeof userId !== "string") {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }
    if (
      role !== null &&
      role !== undefined &&
      role !== "super_admin" &&
      role !== "event_admin"
    ) {
      return NextResponse.json(
        { error: "role must be super_admin, event_admin, or null" },
        { status: 400 },
      );
    }
    if (role === "super_admin" && auth.level !== "owner") {
      return NextResponse.json(
        { error: "Only owner can assign super_admin" },
        { status: 403 },
      );
    }
    const db = getVerceraFirestore();
    const participantDoc = await db
      .collection("vercera_5_participants")
      .doc(userId)
      .get();
    if (!participantDoc.exists) {
      return NextResponse.json(
        { error: "User is not a participant" },
        { status: 400 },
      );
    }
    const participantData = participantDoc.data() || {};
    const fullName = participantData.fullName ?? null;
    const email = participantData.email ?? null;

    if (role === null || role === undefined || role === "") {
      await db.collection("admin_roles").doc(userId).delete();
      return NextResponse.json({ success: true, message: "Role removed" });
    }

    await db.collection("admin_roles").doc(userId).set({
      role,
      fullName,
      email,
      addedBy: auth.uid,
      addedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, message: `Set role to ${role}` });
  } catch (err) {
    console.error("Admin set role error:", err);
    return NextResponse.json({ error: "Failed to set role" }, { status: 500 });
  }
}
