# Environment Variable Configuration

## Server Variables

| Variable | Required | Example | Purpose |
|---|---:|---|---|
| `PORT` | Yes | `5000` | Port used by the Express API inside the container. |
| `NODE_ENV` | Yes | `production` | Runtime environment. |
| `MONGO_URI` | Yes | `mongodb://mongo:27017/medeire` | MongoDB connection string. |
| `JWT_SECRET` | Yes | configured in GitLab CI/CD | Secret used to sign JWT tokens. |
| `JWT_EXPIRES_IN` | No | `7d` | JWT lifetime. |
| `SESSION_SECRET` | Recommended | configured in GitLab CI/CD | Session/OAuth-related secret. |
| `CLIENT_URL` | Yes | `http://p260071-medeire.msc.cs.nuim.ie` | Frontend URL used for CORS and redirects. |
| `GOOGLE_CLIENT_ID` | Optional | `placeholder` | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Optional | `placeholder` | Google OAuth client secret. |
| `GOOGLE_CALLBACK_URL` | Optional | `http://p260071-medeire.msc.cs.nuim.ie/api/auth/google/callback` | OAuth callback URL. |
| `ANTHROPIC_API_KEY` | Optional | `placeholder` | AI triage API key. If missing, rule-based triage is used. |

## MongoDB Variables

| Variable | Required | Example | Purpose |
|---|---:|---|---|
| `MONGO_INITDB_DATABASE` | Yes | `medeire` | Initial MongoDB database name. |

## GitLab CI/CD Variables

Configure these in `Settings -> CI/CD -> Variables`:

| Variable | Required | Example | Visibility | Purpose |
|---|---:|---|---|---|
| `CI_API_PORT` | Yes | `6071` | Visible | Unique host port assigned for the shared fyp server. |
| `JWT_SECRET` | Yes | `MedeireJwtSecret2026_928374_SecureKey` | Masked | Production JWT signing secret. |
| `SESSION_SECRET` | Yes | `MedeireSessionSecret2026_482913_SecureKey` | Masked | Production session secret. |

## Notes

- `CI_API_PORT` is not secret, so it can be visible.
- `JWT_SECRET` and `SESSION_SECRET` should be masked.
- The application still works without Google OAuth or Anthropic keys. Google login reports that it is not configured, and triage falls back to the local rule-based strategy.
- Do not commit real secrets to Git.

