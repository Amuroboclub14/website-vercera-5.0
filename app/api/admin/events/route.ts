import { NextRequest, NextResponse } from "next/server";
import { getVerceraFirestore } from "@/lib/firebase-admin";
import { requireAdminLevel } from "@/lib/admin-auth";
import type { EventRecord } from "@/lib/events-types";

const ALLOWED_LEVELS = ["owner", "super_admin"] as const;

/** GET: List all events (admin). Same as public but requires auth. */
export async function GET(request: NextRequest) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS]);
  if (auth instanceof NextResponse) return auth;
  try {
    const db = getVerceraFirestore();
    const [eventsSnap, regsSnap] = await Promise.all([
      db.collection("events").get(),
      db.collection("registrations").get(),
    ]);
    const countByEventId: Record<string, number> = {};
    regsSnap.docs.forEach((d) => {
      const eid = d.data().eventId as string;
      if (eid) countByEventId[eid] = (countByEventId[eid] || 0) + 1;
    });
    const eventsList: EventRecord[] = eventsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: d.name ?? "",
        category: (d.category as EventRecord["category"]) ?? "technical",
        description: d.description ?? "",
        longDescription: d.longDescription ?? "",
        image: d.image ?? "",
        date: d.date ?? "",
        time: d.time ?? "",
        venue: d.venue ?? "",
        registrationFee: Number(d.registrationFee) ?? 0,
        prizePool: Number(d.prizePool) ?? 0,
        maxParticipants: Number(d.maxParticipants) ?? 0,
        registeredCount: countByEventId[doc.id] ?? 0,
        rules: Array.isArray(d.rules) ? d.rules : [],
        prizes: Array.isArray(d.prizes) ? d.prizes : [],
        isTeamEvent: Boolean(d.isTeamEvent),
        teamSizeMin: d.teamSizeMin != null ? Number(d.teamSizeMin) : undefined,
        teamSizeMax: d.teamSizeMax != null ? Number(d.teamSizeMax) : undefined,
        rulebookUrl:
          typeof d.rulebookUrl === "string" ? d.rulebookUrl : undefined,
        order: d.order != null ? Number(d.order) : undefined,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      };
    });
    eventsList.sort((a, b) => {
      const oa = a.order ?? 999;
      const ob = b.order ?? 999;
      if (oa !== ob) return oa - ob;
      return (a.createdAt || "").localeCompare(b.createdAt || "");
    });
    return NextResponse.json({ events: eventsList });
  } catch (err) {
    console.error("Admin events list error:", err);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}

/** POST: Create event. Owner/super_admin only. */
export async function POST(request: NextRequest) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS]);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const {
      name,
      category,
      description,
      longDescription,
      image,
      date,
      time,
      venue,
      registrationFee,
      prizePool,
      maxParticipants,
      rules,
      prizes,
      isTeamEvent,
      teamSizeMin,
      teamSizeMax,
      rulebookUrl,
      order,
    } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "name and category are required" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const data = {
      name: String(name),
      category: category === "non-technical" ? "non-technical" : "technical",
      description: String(description ?? ""),
      longDescription: String(longDescription ?? ""),
      image: String(image ?? ""),
      date: String(date ?? ""),
      time: String(time ?? ""),
      venue: String(venue ?? ""),
      registrationFee: Number(registrationFee) || 0,
      prizePool: Number(prizePool) || 0,
      maxParticipants: Number(maxParticipants) || 1,
      rules: Array.isArray(rules) ? rules : [],
      prizes: Array.isArray(prizes) ? prizes : [],
      isTeamEvent: Boolean(isTeamEvent),
      teamSizeMin: teamSizeMin != null ? Number(teamSizeMin) : undefined,
      teamSizeMax: teamSizeMax != null ? Number(teamSizeMax) : undefined,
      rulebookUrl:
        rulebookUrl && String(rulebookUrl).trim()
          ? String(rulebookUrl).trim()
          : null,
      order: order != null ? Number(order) : 0,
      createdAt: now,
      updatedAt: now,
    };

    const db = getVerceraFirestore();
    const ref = await db.collection("events").add(data);
    return NextResponse.json({ id: ref.id, ...data });
  } catch (err) {
    console.error("Admin create event error:", err);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 },
    );
  }
}
