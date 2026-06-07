# RigidPort

## Authentication

RigidPort uses two authentication modes:

- Razor Pages use cookie authentication. Sign in at `/Auth/Login` with username `admin`; set `RIGIDPORT_ADMIN_PASSWORD` for the password. If unset, development falls back to `admin`.
- Minimal API routes under `/api/` require an `X-API-Key` header. Set `ALLOWED_API_KEY` to the allowed key. If unset, development falls back to `dev-api-key-change-me`.

Example minimal API call:

```bash
curl -H "X-API-Key: dev-api-key-change-me" http://localhost:5000/api/shipments/search
```
