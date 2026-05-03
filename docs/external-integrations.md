# External Integrations

MedEire includes two external integrations: Google OAuth for authentication and Anthropic for AI-assisted triage.

## Google OAuth 2.0

Purpose:

Google OAuth lets patients sign in without a password. Existing email/password accounts can also be linked by matching the email returned by Google.

Flow:

```text
Browser -> GET /api/auth/google
Server  -> passport-google-oauth20 redirects to Google
Google  -> redirects to /api/auth/google/callback?code=...
Server  -> exchanges code, receives profile
Server  -> authService.handleGoogleUser
          -> find by googleId
          -> else find by email and link googleId
          -> else create patient account
Server  -> redirects to CLIENT_URL/auth/callback?token=<jwt>
Client  -> stores token and fetches /api/auth/profile
```

Configuration:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

Graceful fallback:

If `GOOGLE_CLIENT_ID=placeholder`, the strategy is not registered. `GET /api/auth/google` returns `503 OAUTH_NOT_CONFIGURED` instead of crashing.

Relevant files:

| File | Role |
|---|---|
| `server/src/config/passport.js` | Registers Google and JWT strategies. |
| `server/src/routes/authRoutes.js` | Defines Google OAuth endpoints. |
| `server/src/services/authService.js` | Links or creates OAuth users. |
| `client/src/pages/AuthCallback.jsx` | Stores the returned JWT and redirects by role. |

## Anthropic AI Triage

Purpose:

The AI strategy classifies symptoms as `low`, `medium`, or `high` severity and returns a short explanation plus red flags. It is used as the primary triage strategy when an API key is configured.

API call:

```http
POST https://api.anthropic.com/v1/messages
Content-Type: application/json
x-api-key: <ANTHROPIC_API_KEY>
anthropic-version: 2023-06-01
```

MedEire sends only symptom text, not patient identity.

Expected strategy output:

```json
{
  "severity": "high",
  "reasoning": "Chest pain with shortness of breath can require urgent care.",
  "redFlags": ["chest pain", "shortness of breath"]
}
```

Fallback behaviour:

```text
apiStrategy.classify(symptoms)
  -> missing key, HTTP failure, bad JSON, or invalid severity
  -> throw error
  -> triageService catches the error
  -> ruleStrategy.classify(symptoms)
  -> response includes strategy: "rule"
```

The rule strategy uses keyword lists for high-risk and medium-risk symptoms, so the symptom checker remains usable during development or an API outage.

Privacy:

- No name, email, user ID, or county is sent to Anthropic.
- `TriageLog` stores symptoms, severity, county, age group, language, strategy, and timestamp.
- `TriageLog` intentionally has no patient reference.

Relevant files:

| File | Role |
|---|---|
| `server/src/strategies/triage/apiStrategy.js` | Anthropic request and JSON parsing. |
| `server/src/strategies/triage/ruleStrategy.js` | Local keyword fallback. |
| `server/src/services/triageService.js` | Strategy selector and logging. |
| `server/src/models/TriageLog.js` | Anonymised analytics source. |
