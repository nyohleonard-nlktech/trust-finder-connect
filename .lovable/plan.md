# TrustFix — Build Plan

A premium service marketplace for Cameroon connecting clients with verified local workers (plumbers, electricians, etc.). Phone-based auth, worker KYC with National ID upload, admin approval, in-app messaging, direct call/WhatsApp.

---

## 1. Backend 

**Enable Lovable Cloud first** (provisions Postgres, Auth, Storage).

### Schema
- `profiles` — `id (uuid, FK → auth.users)`, `full_name`, `phone (E.164)`, `role`, `neighborhood`, `created_at`. Auto-created via trigger on signup.
- `user_roles` — `user_id`, `role` enum (`admin`, `worker`, `customer`). Stored separately to prevent privilege escalation, with `has_role()` security-definer function.
- `worker_profiles` — `user_id (FK)`, `service_category`, `neighborhood`, `id_card_url`, `is_verified (bool, default false)`, `is_available (bool, default false)`, `verified_at`, `verified_by`.
- `messages` — `id`, `from_user`, `to_worker`, `body`, `created_at`, `read_at`.
- `services` — seeded list of categories (Plumber, Electrician, Carpenter, Mason, Painter, Mechanic, Cleaner, AC Tech, etc.).

### Storage
- Bucket `verification-docs` (private). RLS: workers upload to own folder; only admins + the worker themselves can read.

### RLS
- Public can SELECT verified worker profiles only (`is_verified = true`).
- Workers can update their own availability.
- Messages: sender + recipient can read; anyone authenticated can insert (to a worker).
- Admin role checked via `has_role(auth.uid(), 'admin')` everywhere.

### Phone normalization
- Client-side helper `normalizePhone()`: strip spaces, if 9 digits starting with `6` → prefix `+237`. Used on signup, login, WhatsApp/tel links.

---

## 2. Auth Flow

- **Phone + Password** via Supabase phone auth (no OTP per spec — password-based).
- Signup form: phone, password, role selector (Customer / Worker), then redirect to onboarding.
- Worker onboarding: full name, service category, neighborhood, **upload National ID photo** → `verification-docs/{user_id}/id.jpg`.
- Auth state: `onAuthStateChange` listener at root, with router invalidation.
- `_authenticated` layout route guards protected pages.
- `_authenticated/_admin` layout route checks `has_role` for admin pages.

---

## 3. Routes

```
/                       → Landing + service search
/services               → Browse all verified workers (search + neighborhood filter)
/worker/$id             → Public worker profile (call, WhatsApp, message form)
/login                  → Phone + password sign-in
/signup                 → Phone + password + role
/_authenticated/onboarding   → Worker KYC form
/_authenticated/dashboard    → Worker dashboard (availability toggle, inbox, status badge)
/_authenticated/inbox        → Worker messages
/_authenticated/_admin/admin → Admin panel: pending workers list + ID viewer + verify button
```

---

## 4. Worker Dashboard
- "Live / Away" switch → updates `is_available` (real-time via Supabase channel).
- Inbox tab: list of received messages, mark-as-read on open.
- Status badge: "Pending Approval" (amber) or "Verified ✓" (green).

## 5. Client Experience
- Search bar (service + neighborhood dropdown: Bambili, Mile 3, Upstation, Bonamoussadi, Akwa, Bastos, etc.).
- Worker card: avatar/initials, name, category, neighborhood, availability dot.
- Buttons:
  - **Call** → `tel:+237…` — disabled with "Worker Busy" label when `is_available = false`.
  - **WhatsApp** → `https://wa.me/237…`.
  - **Message** → opens dialog with form, inserts row in `messages`.

## 6. Admin Panel
- Tabs: All / Pending / Verified.
- Click worker → modal with ID card photo (signed URL from storage) + Verify / Reject buttons.

---

## 7. Design System
- **Burnt Orange** primary `#BC542A`, **Warm Cream** background `#F9F6F2`, **Slate Grey** text.
- Tokens defined in `src/styles.css` as oklch (semantic: `--primary`, `--background`, `--foreground`, `--muted`, etc.).
- Typography: distinctive display font (e.g. **Fraunces** for headings) + clean sans (**Inter**) for body.
- Mobile-first, finger-friendly tap targets (min 44px), bottom-safe spacing.
- Subtle shadows and warm-tinted borders; trust-forward aesthetic.

---

## 8. PWA / Installability

> **Caveat:** The spec asks for a service worker. In Lovable's preview iframe, service workers cause stale content and break navigation. I'll ship a **manifest-only** installable PWA (Add to Home Screen works on iOS + Android) with custom TrustFix logo and `display: "standalone"` — **no service worker, no offline cache**. This is the recommended pattern; full offline PWA can be added later if needed.

- Generate a TrustFix logo (orange, trust-themed).
- `public/manifest.json` with name, icons (192, 512), theme color `#BC542A`, background `#F9F6F2`, `display: "standalone"`.
- Link manifest + apple-touch-icon in `__root.tsx` head.

---

## 9. Build Order

1. Enable Lovable Cloud
2. Migration: enums, tables, `has_role` function, RLS policies, storage bucket + policies, signup trigger
3. Design tokens in `styles.css` + Google Fonts
4. Generate logo asset
5. Auth: signup, login, phone normalization, auth provider/hook
6. Route shells: `_authenticated`, `_admin` guards
7. Worker onboarding (KYC + ID upload)
8. Worker dashboard (availability + inbox)
9. Public discovery: home, services list, worker profile, message dialog
10. Admin panel (pending list, ID viewer, verify action)
11. Manifest + icons, root head links
12. QA: signup as worker → upload ID → admin verify → appears publicly → client messages → worker reads in inbox

---

## Notes / Confirm before I build

- **Phone OTP vs password**: spec says "Phone + Password". Supabase phone auth supports password-based — confirmed.
- **PWA**: manifest-only install (no SW). OK?
- **Neighborhoods**: I'll seed Bambili, Mile 3, Upstation, Bonamoussadi, Akwa, Bastos, Bonapriso, Deido, Bonanjo, Makepe — extendable later.
- **Service categories**: Plumber, Electrician, Carpenter, Mason, Painter, Mechanic, Cleaner, AC Tech, Welder, Tiler.

Approve and I'll start with Cloud + migration.
