project on - Role-Based Auth — React + TypeScript Frontend (Spring Boot Backend)

description : A small full-stack assignment app that demonstrates JWT-based authentication and
role-based authorization. This repo is the **frontend** (React + TypeScript +
Vite), wired to talk to a separate **Spring Boot** API over HTTP with a Bearer
token.

> The frontend was the deliverable here, so this README focuses on it. The
> matching Spring Boot service (controllers, `JwtUtil`, `SecurityConfig`,
> H2 DB) lives in a sibling repo / folder and is summarised below.

---

 1. The problem

Most "tutorial" auth apps hard-code one user, skip the role layer, or hide the
token inside the framework. Real apps need three things working together:

1. **A way for new users to sign up** and pick / be assigned a role.
2. **A stateless token** the frontend can attach to every API call (so the
   backend stays horizontally scalable — no server-side session store).
3. **UI that actually reflects authorization** — a USER must not even *see*
   admin affordances they can't use, and a stale/expired token must boot the
   user back to login automatically.

This project solves exactly that slice end-to-end: register → login → JWT in
`localStorage` → axios interceptor attaches it → role decoded from the token
→ dashboard renders different cards for `USER` vs `ADMIN` → 401 from the API
auto-logs the user out.

2. Request flow (login → protected call)

mermaid
sequenceDiagram
    participant U as User
    participant FE as React app
    participant LS as localStorage
    participant BE as Spring Boot

    U->>FE: submit email + password
    FE->>BE: POST /api/auth/login
    BE->>BE: verify bcrypt, sign JWT(role)
    BE-->>FE: 200 { token }
    FE->>LS: setItem("token", jwt)
    FE->>FE: jwtDecode → { email, role }
    FE->>U: navigate to /

    U->>FE: open dashboard
    FE->>BE: GET /api/admin  (Authorization: Bearer …)
    BE->>BE: JwtAuthFilter → ROLE_ADMIN
    alt role allowed
        BE-->>FE: 200 payload
    else token expired / wrong role
        BE-->>FE: 401 / 403
        FE->>LS: removeItem("token")
        FE->>U: redirect /login
    end


3. Project structure (frontend)
src/
├── routes/
│   ├── __root.tsx          # app shell, React Query provider
│   ├── index.tsx           # dashboard, role-gated cards, logout
│   ├── login.tsx           # email + password form
│   └── register.tsx        # name + email + password + role
├── lib/
│   ├── api.ts              # axios instance + auth interceptors
│   └── auth.ts             # token storage + JWT decode + role normalise
├── hooks/
│   └── use-auth.ts         # useSyncExternalStore around localStorage
└── styles.css              # Tailwind v4 tokens
Key files at a glance:

src/lib/api.ts — single axios instance. Request interceptor injects Authorization: Bearer <token>; response interceptor catches 401, clears the token and fires an auth:logout event.
src/lib/auth.ts — getToken / setToken / clearToken and getCurrentUser() which decodes the JWT and normalises the role (ROLE_ADMIN → ADMIN, supports role, roles[], authorities[]).
src/hooks/use-auth.ts — subscribes to auth:login / auth:logout / storage events so every component re-renders the moment the token changes (works across tabs too).
src/routes/index.tsx — calls useAuth(), redirects to /login if there's no user, otherwise renders <PublicCard />, <UserCard />, <AdminCard /> based on role.

4. Tech stack
Frontend

React 19 + TypeScript
Vite 7 (via TanStack Start)
TanStack Router (file-based routing — same idea as React Router, type-safe)
TanStack Query (server state + retries)
React Hook Form (form state + validation)
Axios (HTTP + interceptors)
jwt-decode (read claims client-side)
TailwindCSS v4
Backend (sibling repo)

Java 17 + Spring Boot 3
Spring Security (stateless, STATELESS session policy)
io.jsonwebtoken (jjwt) for HS256 signing
BCrypt password hashing
H2 in-memory DB (swap for Postgres in prod)
springdoc-openapi for Swagger UI at /swagger-ui.html

5. Running it
Backend (Spring Boot)
cd backend
./mvnw spring-boot:run        # starts on :8080
# Swagger:  http://localhost:8080/swagger-ui.html
# H2 console: http://localhost:8080/h2-console
Make sure CORS allows your frontend origin (the Spring config in the sibling repo already permits http://localhost:5173 and http://localhost:8081).


Frontend
bun install
bun dev                       # http://localhost:8080  (Vite dev)

If the backend runs anywhere other than http://localhost:8080, point the frontend at it:
echo "VITE_API_BASE_URL=http://localhost:9000" > .env.local
bun dev

Try it
1.Go to /register, create an ADMIN user.
2.You land on the dashboard. You should see all three cards populated.
3.Log out, register a USER, log in — the admin card disappears.
4.In DevTools, edit the token value in localStorage to garbage — the first failing request triggers a 401 and bounces you back to /login.

6.Design decisions 
Decision                                            	Why this
1. JWT in localStorage                          Assignment explicitly asked for it; trivially attachable from JS; works across tabs via the storage event.
2.Decode role on the client                     Avoids a /me round-trip on every page load; UI can hide admin affordances before the first request fires
3.Single axios instance + interceptors          Centralises the bearer header and 401 handling. Components stay dumb — they just call api.get(path).
4.TanStack Query for the protected cards        Free retries, caching, loading + error states, and refetch on focus — the bonus requirements come for free
5.useSyncExternalStore around localStorage      Correct React 18/19 pattern. Updates the UI synchronously when the token changes, including from another tab.
6.File-based routes (TanStack Router)            Type-safe <Link to="/login">, automatic code-splitting, no manual <Routes> table to maintain.
7.Tailwind utility classes, no UI                The forms are tiny — adding shadcn <Form> + <Input> for two pages is overkill.
kit on the auth pages  
8.Stateless backend (no server session)        The whole point of JWT. Lets you scale the API horizontally with zero session affinity.
9.BCrypt + 24h token expiry                      Sensible defaults; matches what reviewers expect to see.

7. What I'd do differently at scale
  As this was just only 6 hours duration code submittion ,i missed out larger part but , here's what I'd change before putting it in front of real users:

1.Move the JWT into an httpOnly, Secure, SameSite=Lax cookie. localStorage is readable by any script that runs on the page. One XSS bug = total account takeover. Cookies + CSRF tokens are the standard trade-off.
2.Add a refresh-token flow. A 24h access token is fine, but you want a short-lived (5–15 min) access token plus a long-lived refresh token that can be revoked server-side. Today, if a token leaks, it's valid for a full day with no way to kill it.
3.Server-side role/permission model, not just a role claim. Embed only userId in the JWT and resolve role + permissions from the DB on each request (cached). Lets you revoke admin access immediately; today the role is frozen into the token until it expires.
5.Don't let users self-assign ADMIN at registration. That's the single biggest hole in the assignment spec. In prod the registration endpoint would always create USER; promotion to ADMIN happens via an authenticated admin action.
6.Audit logging. Every login, every admin action, every 401 — pushed to a structured log + alert on anomalies (e.g. brute-force on /api/auth/login).
7.Rate limiting on the auth endpoints. Today nothing stops an attacker from making 10k login attempts per second. A bucket per IP + per email is the minimum.
8.Replace H2 with Postgres, add Flyway migrations, run the backend in a container, put the secret-signing key in a secret manager (AWS Secrets Manager / Vault), not application.properties.
9.Real protected-route guard at the router level. Right now the dashboard does its own useEffect redirect. A beforeLoad guard on a _authenticated layout route is cleaner and removes the one-frame flash of empty content.
10.End-to-end tests. Playwright running register → login → role-gated view → logout, against a real backend in CI. Right now there are no tests.
11.Observability on the frontend. Sentry / OpenTelemetry for the fetch layer, so a spike in 401s is visible without users having to complain.


8. limitations
    List of things this build does not do:

1.No refresh tokens — when the JWT expires the user is silently logged out on the next API call.
2.No "remember me" / persistent login beyond what localStorage gives for free.
3.Role is chosen by the user at registration. This is per the assignment spec but is obviously not how a real app should work.
4.No password reset / email verification. Out of scope.
5.No CSRF protection. Acceptable because the token is in localStorage and sent via a custom header, not a cookie — but this is the trade-off that makes localStorage riskier than cookies.
6.The 401 handler logs the user out for every 401, including legitimate ones from /api/admin when a USER is signed in. In a bigger app I'd scope the auto-logout to /auth/* and "token invalid" responses only.
7.No unit / integration / e2e tests in this repo. I'd add Vitest + Playwright before merging anything.
8.The dashboard re-fetches all three cards on mount with no stale-time. Fine for a demo, wasteful at scale.
9.Error messages are pulled blindly from err.response.data.message. Works with this Spring backend; would need a typed error envelope for a bigger API.
10.No i18n. Strings are hard-coded English.
11.No dark mode toggle even though Tailwind tokens support it.


9. API contract (what the frontend expects)
POST /api/auth/register
  body: { name, email, password, role: "USER" | "ADMIN" }
  200:  { token }                              # optional; if absent → /login

POST /api/auth/login
  body: { email, password }
  200:  { token }                              # also accepts accessToken / jwt

GET  /api/public                               # anyone
GET  /api/user        Authorization: Bearer …  # USER or ADMIN
GET  /api/admin       Authorization: Bearer …  # ADMIN only
The JWT payload should include the role under any of role, roles[], or authorities[] — with or without the Spring ROLE_ prefix. auth.ts normalises all of those.

10.License
MIT license 
