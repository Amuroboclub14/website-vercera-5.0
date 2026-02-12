/**
 * Verifies AMURoboclub membership via the API route.
 * The API uses Firebase Admin SDK to query members_2025 in the AMURoboclub project,
 * so Vercera 5.0 can use its own dedicated Firebase project for Auth while
 * still verifying members against AMURoboclub's data.
 */
export interface MemberVerificationResult {
  verified: boolean
  error?: string
}

export async function verifyAMURoboclubMember(data: {
  enrollmentNumber: string
  facultyNumber: string
  mobile: string
  email: string
}): Promise<MemberVerificationResult> {
  try {
    const res = await fetch('/api/verify-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enrollmentNumber: data.enrollmentNumber,
        facultyNumber: data.facultyNumber,
        mobile: data.mobile,
        email: data.email,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      return { verified: false, error: result.error || 'Verification failed. Please try again.' }
    }

    return result
  } catch (err) {
    console.error('Member verification error:', err)
    return { verified: false, error: 'Verification failed. Please try again.' }
  }
}
