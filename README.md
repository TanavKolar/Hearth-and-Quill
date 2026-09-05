# User-Authenticated Gemini Reflections Journal

A production-grade, secure journaling and reflection web application powered by Next.js 15, Google Cloud Firestore, Firebase Authentication, and the Gemini 3.6 Flash API with automatic fallback resilience.

---

## Architecture & Security Model

The system enforces strict owner-bound data isolation and adheres to OWASP Top 10 and OWASP LLM security standards across 5 Threat Zones:
- **Input Surfaces**: Client and server-side defensive schema ingestion, 12,000 character limits, and safe React markdown rendering.
- **Planning & Reasoning**: Strict system prompts establishing user journal reflections as plain data (OWASP LLM01 defense).
- **Tool & API Execution**: Server-side Gemini proxy (`/api/reflect`) equipped with the **Resilient Model Fallback Ladder**:
  1. Primary: `gemini-3.6-flash`
  2. High-Availability Fallback: `gemini-3.1-flash-lite`
  3. Dynamic Alias: `gemini-flash-latest`
  4. Deep Reasoning Fallback: `gemini-3.7-flash`
- **Memory & State Isolation**: Owner-bound Firestore rules preventing cross-user data leaks (`/users/{userId}/interactions/{interactionId}`).
- **Secret Management Hygiene**: Zero hardcoded keys; secrets are loaded dynamically via Google Cloud Secret Manager.

---

## 1. Environment & Prerequisites

### Enable Required Google Cloud APIs
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  identitytoolkit.googleapis.com
```

### Install CLI Tools
- **Google Cloud SDK**: `gcloud components install beta`
- **Firebase CLI**: `npm install -g firebase-tools`

---

## 2. Cloud Firestore Security Rules Configuration

Deploy the owner-bound security rules to ensure user isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

To deploy via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 3. Secret Management Setup (Google Cloud Secret Manager)

Create and populate the `GEMINI_API_KEY` secret, and bind access to your Cloud Run service account:

```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the default Cloud Run compute service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Google Cloud Run Deployment Flow

Deploy containerized Next.js service to Google Cloud Run:

```bash
gcloud run deploy user-authenticated-gemini-reflections-journal \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

---

## 5. Required Campaign Labeling (Automated Verification)

Apply the mandatory challenge verification label to your Cloud Run service:

```bash
gcloud run services update user-authenticated-gemini-reflections-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-southeast1
```

---

## Local Development

```bash
# Install dependencies
npm install

# Run local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.
