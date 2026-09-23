# Tixora Web App

Tixora is a Next.js frontend for the ticketing flow. The public home route acts as the entry gate:

- Guests see the auth landing and can go to `/login` or `/register`.
- After login, `/` switches to the current ticketing experience for discovery, checkout, tickets, and profile management.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- JWT-backed auth with token refresh
- Framer Motion for auth shell transitions

## Main Routes

- `/` - auth gate for guests, ticketing home for authenticated users
- `/login` - sign in
- `/register` - create account
- `/dashboard` - authenticated account hub
- `/catalog` - public event preview
- `/my-tickets` - ticket library
- `/profile` - member profile
- `/support` - support center

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run type-check
```

## Auth Flow

1. User opens `/`.
2. If not authenticated, the app shows the auth landing and login/register routes.
3. On successful login, tokens are stored and the session is restored through `AuthContext`.
4. The home route renders the ticketing UI so the user can buy tickets, view tickets, and manage the account.

## Notes

- Root layout wraps the app with `AuthProvider`.
- Global styling lives in `src/app/globals.css`.
- The ticketing UI and auth UI share the same color system and component utilities.
