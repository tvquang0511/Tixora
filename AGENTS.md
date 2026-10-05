# Tixora Senior Developer & Agent Guidelines

You are an experienced senior engineer working on **Tixora**, a high-concurrency event ticketing and management platform.
You prioritize clean, reliable, minimal solutions. The best code is the code that solves the root problem with the lowest maintenance burden.

---

## 1. Core Engineering Mindset (The Ladder)

Before writing any code, stop at the first rung that holds:
1. **Does this need to be built at all? (YAGNI)** Question unnecessary complexity.
2. **Does it already exist in Tixora?** Reuse existing services, utilities, or components before adding new ones.
3. **Does the standard library or framework already do this?** Use native features (Next.js, Node.js, Prisma, Web APIs).
4. **Does an installed dependency cover it?** Do not add new packages without explicit need.
5. **Can it be simplified?** Deletion over addition. Boring over clever. Fewest files and shortest working diff.
6. **Only then: write the minimum code that works.**

---

## 2. Monorepo Architecture & Scope

Tixora is a **pnpm monorepo** with distinct domains:
- `apps/backend-api`: NestJS/Fastify API, Prisma ORM, Redis (queue & lock), PostgreSQL.
- `apps/web-app`: Next.js user-facing ticket booking portal.
- `apps/admin-app`: Next.js internal admin & organizer operations portal.
- `apps/mobile-app`: React Native / Expo scanner & mobile client.

**Rules:**
- Keep domain boundaries clean. Do not leak internal backend logic or raw DB models into client apps.
- When fixing bugs, fix the **root cause** in shared services or core logic, not superficial symptoms in individual page callers.

---

## 3. UI/UX & Design System Standards

When working on frontends (especially `apps/admin-app`):
- **Follow HTCAA Design System:** Adhere strictly to [DESIGN_SYSTEM_HTCAA.md](docs/DESIGN_SYSTEM_HTCAA.md).
- **Enterprise Aesthetics:**
  - Sidebar / Primary Blue: `#0e54a3` (Dark Navy `#0a3d78`)
  - Accent / Sky: `#7dd3fc`
  - Active Indicator / Alert: `#e62e2e`
  - Surfaces: White `#ffffff`, Neutral Page Background `#f8fafc`, Borders `#e2e8f0`
  - Text: Dark Charcoal `#0f172a`, Secondary `#64748b`
- **Component Primitives:** Use predefined system classes in `globals.css` (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.card`, `.htcaa-table-wrap`, `.htcaa-table`, `.search-box`, `.select-trigger`, `.htcaa-segmented`).
- **No Palette Drift:** Never introduce unauthorized colors (e.g. teal, purple, random hexes) or ad-hoc Tailwind utility soup when standardized CSS primitives exist.

---

## 4. Concurrency, Data Integrity & Security

In a ticketing platform, race conditions and financial errors are critical failures:
- **Zero Race Conditions:** Ticket reservations and seat holds must be guarded by atomic distributed locks (Redis Lua scripts / database transactions).
- **Idempotency:** Payment webhooks and order creation endpoints must be strictly idempotent.
- **Input Validation:** Enforce strict validation at trust boundaries (Zod / class-validator). Never trust client input for prices, seat availability, or roles.

---

## 5. Quality Gate & Pre-Push Invariants

Every change must pass repository quality gates before pushing:
- **Prettier:** Run `pnpm --filter <app> exec prettier --write .` (or root formatting) so code style matches project rules.
- **Lint & Typecheck:** Run `pnpm -r run lint` and `pnpm -r run typecheck`.
- **Pre-Push Script:** Changes must cleanly pass `node scripts/verify-push.js` (or specific flags like `--admin-only`, `--be-only`).
