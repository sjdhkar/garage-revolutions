# Deployment & Operations Guide

This app is a single-garage Angular + Firebase workshop CRM (see the in-repo
audit artifact from the modernization project for the full architecture
history). This doc covers what's needed to run, deploy, and operate it.

## Local development

```
npm install
npm run start        # ng serve, http://localhost:4200
npm run test          # Vitest unit tests
npm run build          # production build to dist/garage-crm
```

## Firebase project

- Project: `garage-revolutions` (see `src/app/core/configs/firebase.config.ts`
  for the client config — these values are not secrets; Firestore security
  rules are what actually protect the data).
- Firestore security rules live in `firestore.rules` at the repo root and are
  **not auto-deployed by any CI/CD in this repo**. Deploy them explicitly:

  ```
  firebase login
  firebase deploy --only firestore:rules
  ```

  `firebase.json` at the repo root points at `firestore.rules` and also
  configures the local Firestore emulator (`firebase emulators:start --only
  firestore`), which is how the rules were validated during development —
  see the emulator-based test suite referenced in the project's audit
  history. Re-run that validation after any rules change, before deploying.

## Deploy targets

- **GitHub Pages**: `.github/workflows/deploy.yml` builds with
  `--base-href /garage-revolutions/` and publishes to Pages. Runs `npm run
  test -- --watch=false` first — a red test suite blocks the deploy.
- **Electron desktop build**: `npm run electron:build` (via
  `electron-builder`). Output directory is configured in `package.json`'s
  `build.directories.output` — check that path is correct on whatever
  machine runs the actual build.
- **Netlify**: no working CI config exists for this. The `.netlify/`
  directory some local machines have is Netlify CLI's own local cache/state
  (already gitignored, never committed) — it is not a deployment config to
  fix or maintain.

## Backups

No automated Firestore backup is configured in this repo (that requires
GCP-side infrastructure — a scheduled export via Cloud Scheduler + a Cloud
Function, or `gcloud firestore export`, both need billing/IAM access this
repo doesn't provision). Recommended setup for whoever has console access:

1. Enable the Firestore [managed export/import
   feature](https://firebase.google.com/docs/firestore/manage-data/export-import)
   for the `garage-revolutions` project.
2. Schedule a daily export via Cloud Scheduler → Cloud Functions (or
   `gcloud firestore export gs://<bucket>/backups/$(date +%F)` on a cron).
3. Set a lifecycle rule on the backup bucket to expire exports after a
   reasonable retention window (e.g. 30-90 days) to control storage cost.

## Error visibility

There's no external error-tracking account (Sentry, etc.) wired up. Instead:

- `AppErrorHandler` (`src/app/core/app-error-handler.ts`) catches every
  uncaught exception app-wide and routes it through `LoggingService`.
- `LoggingService` (`src/app/core/services/logging.service.ts`) writes to
  both the browser console and a Firestore `activityLogs` collection
  (garage-scoped), so errors survive after the tab closes.
- Only `owner`/`manager` roles can read `activityLogs` (see
  `firestore.rules`) — check that collection in the Firebase console if
  something's going wrong for a user and you can't reproduce it locally.

If real error-tracking (Sentry/similar) is wanted later, swap
`LoggingService.logError`'s body for the vendor SDK call — every call site
already funnels through that one method.

## Multi-tenancy model

This is currently a **single-garage** application, deliberately:

- Every collection carries a `garageId` field and every query filters by it
  (`src/app/core/configs/garage.constants.ts` defines the one constant ID,
  `'main'`), so the data model is *shaped* like a multi-tenant system.
- In practice there is exactly one `garages/main` document, and every user's
  `AppUser.garageId` points at it. A user belongs to exactly one garage — no
  multi-garage-per-user support exists or is planned per current
  requirements.
- Firestore security rules enforce garage-scoping independently of the
  client (`isActiveMember(garageId)` in `firestore.rules`), so this isn't
  just a client-side convention.

**If a second garage is ever needed**: the schema doesn't need to change.
What's missing is (a) a UI to create a new `garages/{id}` document and (b) a
way to onboard a user into a *specific* garage at registration time (today,
`AuthService.createUserProfile` hardcodes every new registrant to
`DEFAULT_GARAGE_ID` and the `'owner'` role — see
`src/app/core/services/auth.service.ts`). Both are small, additive changes;
neither requires touching the Firestore rules or any existing collection's
shape.

## Roles

`UserRole` (`src/app/core/models/user.model.ts`): `owner`, `manager`,
`service_advisor`, `technician`, `accountant`, `super_admin`. Every
self-registered user becomes `owner` — there is no invite flow or
registration-time role picker. To make someone a `technician` (or any other
role) today, an existing `owner`/`manager` must edit that user's `role`
field directly (Firestore rules permit this for `isManagerOrOwner`, but
there's no dedicated "Team" UI for it yet — it's a plausible next feature,
not a security gap: the rule enforcement already exists, only the
convenience screen doesn't).

Only `technician` currently has special-cased behavior: they see and can
edit only their own `assignedTechnicianId` job cards (enforced in
`firestore.rules`, not just hidden in the UI). Every other role sees
everything in the garage.
