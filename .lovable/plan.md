# Admin side: where it is, and how to make it real

## Where it is today

There is already an Admin Console UI, but it is only reachable from the home screen and only for a
hardcoded email address. Verified current state:

- The admin button appears when the signed-in user's email is literally `efe.alpay@gmail.com`
  (hardcoded in the app, plus the "Debug" tab in Settings).
- The console has three tabs: Users, Settings (limits + plan copy), Analytics (tier split, usage charts).
- The database has a proper roles table with an `admin` role, and admin read/update policies on
  profiles — but **no user currently has the admin role**, so those policies never grant anything.
- Admin actions are done from the browser with the normal user's permissions, so today:
  saving global config fails (needs admin role), and deleting a user fails (no delete policy at all).
- The Settings tab still edits legacy Gumroad plan links, which no longer drive checkout (Paddle does).

So: the admin screen exists, but user management is not actually functional or secured yet.

## What to build

### 1. Real admin role instead of a hardcoded email
- Grant the `admin` role to your account in the roles table.
- The app decides admin visibility by asking the backend whether the signed-in user has the admin
  role (cached in a query), not by comparing an email string. Same for the Settings "Debug" tab.

### 2. Move admin actions to the server
All admin reads/writes go through authenticated server functions that first verify the caller has
the admin role, then act with elevated privileges:
- List users: email, name, tier, tokens used, weekly usage, subscription status/interval, join date,
  with search + sorting and pagination.
- Change a user's tier manually (with a note that a real Paddle subscription can override it on next sync).
- Grant / revoke the admin role for another user.
- Reset a user's weekly usage counter.
- Delete a user: removes their mindmaps, usage, subscription rows, profile, and the auth account.
- Read/save global config (weekly limit, Plus/Pro token limits, plan names/descriptions).

### 3. Admin dashboard as a real route
- Add a protected `/admin` route so the console is a page (bookmarkable), not just a modal, and
  redirect non-admins away. Keep the existing modal entry point working.
- Update the console UI to use the new server functions, and replace the Gumroad link fields with
  read-only Paddle plan info (checkout is managed by the payments provider now).

### 4. Analytics tab
Keep the existing charts but feed them from the server list: users per tier, signups over time,
token usage leaders, active vs canceled subscriptions.

## Technical notes

- New `src/lib/admin.functions.ts` with `requireSupabaseAuth` middleware plus an in-handler
  `has_role(userId, 'admin')` check before any privileged work; privileged client imported inside
  the handler.
- Migration: insert the admin role row for your account, and add admin-scoped policies where the
  UI needs them (admin delete on profiles/mindmaps/usage, admin read on usage and subscriptions),
  with matching GRANTs.
- The admin console stops using the Firestore compatibility layer and calls the new server
  functions directly; auth deletion uses the Auth admin API server-side.
- Client-side admin checks are for showing/hiding UI only; every privileged operation is
  re-verified server-side.
