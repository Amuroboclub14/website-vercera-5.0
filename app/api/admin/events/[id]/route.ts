import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { getVerceraFirestore } from '@/lib/firebase-admin'
import { requireAdminLevel } from '@/lib/admin-auth'
import { dedupeRegistrationsByUserEventTeam } from '@/lib/dedupe-registrations'

const ALLOWED_LEVELS = ['owner', 'super_admin'] as const
const cleanString = (v: unknown): string | null => {
  const s = String(v ?? '').trim()
  return s.length ? s : null
}

/** GET: Single event (admin). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    const db = getVerceraFirestore()
    const doc = await db.collection('events').doc(id).get()
    if (!doc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    const [regsSnap, participantsSnap] = await Promise.all([
      db.collection('registrations').where('eventId', '==', id).get(),
      db.collection('vercera_5_participants').get(),
    ])
    const activeParticipantIds = new Set(participantsSnap.docs.map((d) => d.id))
    const d = doc.data()!
    const participantCountOffset = Number(d.participantCountOffset ?? 0) || 0
    const realRegisteredCount = dedupeRegistrationsByUserEventTeam(
      regsSnap.docs
        .map((x) => ({ id: x.id, ...(x.data() as { userId?: string; eventId?: string; teamId?: string; verceraTeamId?: string; createdAt?: string }) }))
        .filter((r) => r.userId && activeParticipantIds.has(r.userId))
    ).length
    const registeredCount = Math.max(0, realRegisteredCount + participantCountOffset)
    return NextResponse.json({
      id: doc.id,
      ...d,
      realRegisteredCount,
      participantCountOffset,
      registeredCount,
    })
  } catch (err) {
    console.error('Admin get event error:', err)
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

/** PUT: Update event. Owner/super_admin only. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    const body = await request.json()
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
      participantCountOffset,
    } = body

    const db = getVerceraFirestore()
    const ref = db.collection('events').doc(id)
    const existing = await ref.get()
    if (!existing.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const data: Record<string, unknown> = {
      updatedAt: now,
    }
    if (name !== undefined) data.name = String(name)
    if (category !== undefined) data.category = category === 'non-technical' ? 'non-technical' : 'technical'
    if (description !== undefined) data.description = String(description)
    if (longDescription !== undefined) data.longDescription = String(longDescription)
    if (eventImages !== undefined) {
      const images = Array.isArray(eventImages) ? eventImages : (image !== undefined ? [String(image)] : undefined)
      if (images?.length) {
        data.eventImages = images
        data.image = images[0]
      }
    } else if (image !== undefined) {
      data.image = String(image)
    }
    if (date !== undefined) data.date = String(date)
    if (time !== undefined) data.time = String(time)
    if (venue !== undefined) data.venue = String(venue)
    if (registrationFee !== undefined) data.registrationFee = Number(registrationFee) || 0
    if (prizePool !== undefined) data.prizePool = Number(prizePool) || 0
    if (maxParticipants !== undefined) data.maxParticipants = Number(maxParticipants) || 1
    if (rules !== undefined) data.rules = Array.isArray(rules) ? rules : []
    if (prizes !== undefined) data.prizes = Array.isArray(prizes) ? prizes : []
    if (isTeamEvent !== undefined) data.isTeamEvent = Boolean(isTeamEvent)
    if (teamSizeMin !== undefined) data.teamSizeMin = teamSizeMin == null ? null : Number(teamSizeMin)
    if (teamSizeMax !== undefined) data.teamSizeMax = teamSizeMax == null ? null : Number(teamSizeMax)
    if (rulebookUrls !== undefined) data.rulebookUrls = Array.isArray(rulebookUrls) && rulebookUrls.length ? rulebookUrls : null
    if (attachmentUrls !== undefined) data.attachmentUrls = Array.isArray(attachmentUrls) && attachmentUrls.length ? attachmentUrls : null
    if (order !== undefined) data.order = order == null ? 0 : Number(order)
    if (excludedFromBundles !== undefined || excludedFromTechnicalBundle !== undefined) {
      const v =
        excludedFromBundles !== undefined
          ? Boolean(excludedFromBundles)
          : Boolean(excludedFromTechnicalBundle)
      data.excludedFromBundles = v
      data.excludedFromTechnicalBundle = FieldValue.delete()
    }
    if (includedInNonTechnicalBundle !== undefined) data.includedInNonTechnicalBundle = Boolean(includedInNonTechnicalBundle)
    if (participantCountOffset !== undefined) data.participantCountOffset = Number(participantCountOffset) || 0
    if (flagship !== undefined) data.flagship = Boolean(flagship)
    if (flagshipSponsor !== undefined) {
      if (flagshipSponsor && typeof flagshipSponsor === 'object') {
        const s = flagshipSponsor as { name?: unknown; logoUrl?: unknown; websiteUrl?: unknown; categories?: unknown }
        const name = cleanString(s.name)
        const logoUrl = cleanString(s.logoUrl)
        const websiteUrl = cleanString(s.websiteUrl)
        const categories = Array.isArray(s.categories)
          ? s.categories.map((v) => String(v).trim()).filter(Boolean)
          : []

        // Never send undefined nested values to Firestore.
        data.flagshipSponsor = name
          ? {
              name,
              ...(logoUrl ? { logoUrl } : {}),
              ...(websiteUrl ? { websiteUrl } : {}),
              ...(categories.length ? { categories } : {}),
            }
          : null
      } else {
        data.flagshipSponsor = null
      }
    }
    if (specialCategoryAward !== undefined) {
      if (specialCategoryAward && typeof specialCategoryAward === 'object') {
        const a = specialCategoryAward as { name?: unknown; description?: unknown; logoUrl?: unknown }
        const name = cleanString(a.name)
        const description = cleanString(a.description)
        const logoUrl = cleanString(a.logoUrl)
        data.specialCategoryAward = name
          ? {
              name,
              description: description ?? '',
              ...(logoUrl ? { logoUrl } : {}),
            }
          : null
      } else {
        data.specialCategoryAward = null
      }
    }

    await ref.update(data)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin update event error:', err)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

/** DELETE: Delete event. Owner/super_admin only. Fails if event has registrations. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminLevel(request, [...ALLOWED_LEVELS])
  if (auth instanceof NextResponse) return auth
  try {
    const { id } = await params
    if (!id) return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
    const db = getVerceraFirestore()
    const ref = db.collection('events').doc(id)
    const existing = await ref.get()
    if (!existing.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    const regsSnap = await db.collection('registrations').where('eventId', '==', id).limit(1).get()
    if (!regsSnap.empty) {
      return NextResponse.json(
        { error: 'Cannot delete event that has registrations' },
        { status: 400 }
      )
    }
    await ref.delete()
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin delete event error:', err)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
