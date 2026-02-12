# Firebase Setup for Vercera 5.0

## Use a DEDICATED Firebase Project (Recommended)

To get **fresh, isolated auth** for Vercera 5.0 (no overlap with AMURoboclub or other apps):

### 1. Create New Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** → Name it "Vercera 5.0" (or similar)
3. Create the project (disable Google Analytics if not needed)

### 2. Enable Services

- **Authentication** → Sign-in method → Enable **Email/Password**
- **Firestore Database** → Create database (start in test mode, then add rules below)
- **Storage** → Get started

### 3. Register Web App

- Project Settings → General → Your apps → Add app → Web (</>)
- Copy the config values

### 4. Update .env.local

Use the **new project's** config in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=vercera-5-0-xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=vercera-5-0-xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=vercera-5-0-xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 5. Firestore Rules (for the new Vercera project)

In Firebase Console → Firestore → Rules, use:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /vercera_5_participants/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /registrations/{regId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null;
    }
  }
}
```

### 6. AMURoboclub Member Verification (Optional)

To verify AMURoboclub members during signup, we query `members_2025` in the **AMURoboclub** project via an API route.

**Get the AMURoboclub service account:**

1. Open the **AMURoboclub** Firebase project
2. Project Settings → Service accounts → Generate new private key
3. Download the JSON file

**Add to .env.local:**

```env
# Paste the entire JSON as a single line (escape quotes if needed)
# Or use a file path: FIREBASE_AMUROBOCLUB_SERVICE_ACCOUNT_PATH=/path/to/amuroboclub-key.json
FIREBASE_AMUROBOCLUB_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Note:** For Vercel deployment, put the full JSON string in the env var. For local dev, you can also use a path if you add support.

If this is not set, AMURoboclub member verification will fail when someone selects "Yes" to being a member. Non-members can still sign up.

---

## Summary

| What              | Project          |
|-------------------|------------------|
| Auth (email/pwd)  | **Vercera 5.0** (your new project) |
| vercera_5_participants | **Vercera 5.0** |
| registrations     | **Vercera 5.0**  |
| members_2025      | **AMURoboclub** (read via API)     |
