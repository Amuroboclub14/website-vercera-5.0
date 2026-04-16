import { NextRequest, NextResponse } from "next/server";
import { getVerceraFirestore } from "@/lib/firebase-admin";
import { requireAdminLevel } from "@/lib/admin-auth";
import type { EventRecord } from "@/lib/events-types";
import { readExcludedFromAllBundles } from "@/lib/event-bundle-flags";
import { dedupeRegistrationsByUserEventTeam } from "@/lib/dedupe-registrations";

const READ_LEVELS = ["owner", "super_admin", "event_admin"] as const;
const MUTATE_LEVELS = ["owner", "super_admin"] as const;

/** GET: List all events (admin). Same as public but requires auth. */
export async function GET(request: NextRequest) {
  const auth = await requireAdminLevel(request, [...READ_LEVELS]);
  if (auth instanceof NextResponse) return auth;
  try {
    const db = getVerceraFirestore();
    const [eventsSnap, regsSnap, participantsSnap] = await Promise.all([
      db.collection("events").get(),
      db.collection("registrations").get(),
      db.collection("vercera_5_participants").get(),
    ]);
    const activeParticipantIds = new Set(participantsSnap.docs.map((d) => d.id));
    const registrations = regsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
      id: string;
      userId?: string;
      eventId?: string;
    }>;
    const registrationsActive = dedupeRegistrationsByUserEventTeam(
      registrations.filter((r) => r.userId && activeParticipantIds.has(r.userId))
    );
    const countByEventId: Record<string, number> = {};
    registrationsActive.forEach((r) => {
      const eid = r.eventId;
      if (eid) countByEventId[eid] = (countByEventId[eid] || 0) + 1;
    });
    const eventsList: EventRecord[] = eventsSnap.docs.map((doc) => {
      const d = doc.data();
      const eventImages = Array.isArray(d.eventImages) ? d.eventImages : [];
      const image = eventImages[0] ?? d.image ?? "";
      const rulebookUrls = Array.isArray(d.rulebookUrls) ? d.rulebookUrls : [];
      const rulebookUrl = rulebookUrls[0] ?? (typeof d.rulebookUrl === "string" ? d.rulebookUrl : undefined);
      return {
        id: doc.id,
        name: d.name ?? "",
        category: (d.category as EventRecord["category"]) ?? "technical",
        description: d.description ?? "",
        longDescription: d.longDescription ?? "",
        image,
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
        rulebookUrl,
        eventImages: eventImages.length ? eventImages : undefined,
        rulebookUrls: rulebookUrls.length ? rulebookUrls : undefined,
        attachmentUrls: Array.isArray(d.attachmentUrls) && d.attachmentUrls.length ? d.attachmentUrls : undefined,
        order: d.order != null ? Number(d.order) : undefined,
        excludedFromBundles: readExcludedFromAllBundles(d),
        includedInNonTechnicalBundle: Boolean(d.includedInNonTechnicalBundle),
        flagship: Boolean(d.flagship),
        flagshipSponsor:
          d.flagshipSponsor && typeof d.flagshipSponsor === "object"
            ? (d.flagshipSponsor as EventRecord["flagshipSponsor"])
            : undefined,
        specialCategoryAward:
          d.specialCategoryAward && typeof d.specialCategoryAward === "object"
            ? (d.specialCategoryAward as EventRecord["specialCategoryAward"])
            : undefined,
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
  const auth = await requireAdminLevel(request, [...MUTATE_LEVELS]);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await request.json();
    const {
      name,
      category,
      description,
      longDescription,
      image,
      eventImages,
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
      rulebookUrls,
      attachmentUrls,
      order,
      excludedFromBundles,
      excludedFromTechnicalBundle,
      includedInNonTechnicalBundle,
      flagship,
      flagshipSponsor,
      specialCategoryAward,
    } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: "name and category are required" },
        { status: 400 },
      );
    }

    const images = Array.isArray(eventImages) && eventImages.length > 0 ? eventImages : (image ? [image] : []);
    const primaryImage = images[0] ?? "";

    const now = new Date().toISOString();
    const data: Record<string, unknown> = {
      name: String(name),
      category: category === "non-technical" ? "non-technical" : "technical",
      description: String(description ?? ""),
      longDescription: String(longDescription ?? ""),
      image: primaryImage,
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
      order: order != null ? Number(order) : 0,
      excludedFromBundles: Boolean(
        excludedFromBundles ?? excludedFromTechnicalBundle,
      ),
      includedInNonTechnicalBundle: Boolean(includedInNonTechnicalBundle),
      flagship: Boolean(flagship),
      createdAt: now,
      updatedAt: now,
    };
    if (flagshipSponsor && typeof flagshipSponsor === "object") {
      const s = flagshipSponsor as {
        name?: unknown;
        logoUrl?: unknown;
        websiteUrl?: unknown;
        categories?: unknown;
      };
      data.flagshipSponsor = {
        name: String(s.name ?? "").trim(),
        logoUrl: s.logoUrl ? String(s.logoUrl) : undefined,
        websiteUrl: s.websiteUrl ? String(s.websiteUrl) : undefined,
        categories: Array.isArray(s.categories) ? s.categories.map((v) => String(v)).filter(Boolean) : undefined,
      };
    }
    if (specialCategoryAward && typeof specialCategoryAward === "object") {
      const a = specialCategoryAward as { name?: unknown; description?: unknown; logoUrl?: unknown };
      data.specialCategoryAward = {
        name: String(a.name ?? "").trim(),
        description: String(a.description ?? "").trim(),
        logoUrl: a.logoUrl ? String(a.logoUrl) : undefined,
      };
    }
    if (images.length) data.eventImages = images;
    if (Array.isArray(rulebookUrls) && rulebookUrls.length) data.rulebookUrls = rulebookUrls;
    if (Array.isArray(attachmentUrls) && attachmentUrls.length) data.attachmentUrls = attachmentUrls;

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
