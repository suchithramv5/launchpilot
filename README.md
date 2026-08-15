# Handoff: LaunchPilot — Product Launch Tracking App

## Overview
LaunchPilot is a multi-role web app for tracking a physical product launch (e.g. a new cosmetics SKU) end-to-end: readiness checklist, task ownership, compliance sign-off, stakeholder/team roster with view permissions, accountability history, and a post-launch retrospective. Different people (the launch lead, marketing, upstream ops, compliance, leadership/stakeholders, external vendors) see different scoped views of the same launch.

## About the Design Files
The bundled file (`LaunchPilot.dc.html`) is a **design reference prototype**, built in an HTML/React-like templating tool for rapid iteration — it is **not production code to copy directly**. All state lives in one in-memory React-style component (`class Component`) with no backend, no persistence (a page reload resets everything), and no routing library (navigation is just a `screen` string in state). Your task is to **recreate this design and its behavior in your actual target stack** (React/Next, Vue, mobile native, etc. — whichever this codebase uses, or the best fit if none exists yet) using that stack's real data layer, auth, and routing.

Do not literally port the inline-styled markup — treat it as a behavior and layout spec. Use your codebase's existing design system/component library for visual styling; this prototype's colors/spacing are a reasonable default if you have no existing system to match.

## Fidelity
**High-fidelity for layout and interaction flow, low-fidelity for visual styling.** Screen structure, what data appears where, which actions are available to which role, and navigation between screens should be recreated precisely. Colors, spacing, and typography are a plain neutral starting aesthetic (see Design Tokens below) — feel free to restyle to match your product's real design system.

## Roles & Access Model
There is no real auth — `users` is an in-memory array and "login" just sets `currentUserId`. Recreate this as real authentication, but preserve the **role model**:

| Role | Person (demo) | Landing screen | Access |
|---|---|---|---|
| `launch_lead` | Priya Sharma | Launches home (all launches) | Full edit access to everything: checklist, roster, compliance, retro |
| `compliance` | Rohan Mehta | Launches home (filtered to launches they're on the roster for) | Owns compliance flags, sign-off queue, packet submission; edits only compliance/regulatory tasks |
| `upstream_ops` | Ananya Rao | Launches home (filtered) | Owns manufacturing/vendor booking tasks; edits only her own tasks |
| `marketing` | Karan Bose | Launches home (filtered) | View-only marketing dashboard; no edit rights |
| `admin` | Devika Nair | Admin — Manage user roles | Grant/revoke access, change roles/tiers; same edit rights as launch_lead on launch data |
| `legal` | (none seeded) | Static "view only" stub screen | Not built out — placeholder |
| `external` | vendor contacts (not real logins in the demo — they exist only as roster rows) | Minimal external view, scoped to one `assignedLaunchId` | Read-only, single launch |
| custom roles (admin-created) | — | "Custom role dashboard" (read-only), scoped to one `assignedLaunchId` | Read-only overview of one launch |

**Per-launch roster (separate from the global `users`/login list):** each launch has its own `team` array of people — Leadership, Stakeholder, Team member, or External — each with a `title` and two independent checkboxes: "Can view launch summary" and "Can view retrospective." Only the launch lead can add/edit/remove roster entries or change these permissions. A person's roster permission (not their global role) gates whether the Summary/Retrospective links appear on their Launch Detail screen.

## Screens / Views

### 1. Login
- Email + password form (client-side only validation: valid email format, password ≥ 8 chars, must match a seeded user's email — there is no real password check).
- "Forgot password?" → Reset password screen (email input → static "check your email" confirmation; no real email sent).
- "Or continue as (demo)" — a list of every seeded user, click to log in as them instantly. **Remove this in production** — it exists purely for demoing multiple roles without separate accounts.
- On successful login, role determines landing screen (see table above).

### 2. Reset Password
- Email field → validates it matches a seeded user → shows a static "reset instructions sent" confirmation. No real flow.

### 3. Launches Home ("Your launches")
- For `launch_lead`/`admin`: lists **every** launch in the system, with a "+ New launch" button.
- For team-role users (`compliance`, `upstream_ops`, `marketing`): lists only launches where their email appears in that launch's `team` roster. No "+ New launch" button.
- Each launch card shows: name, progress %, at-risk/blocked counts, next milestone (earliest incomplete task), open compliance flag count.
- Click a card → Launch Detail screen.

### 4. All Launches (shared, reachable from top nav for every role)
- Same card list, unfiltered, read-only-ish entry point — a "browse everything" view distinct from the personalized home.

### 5. Launch Detail (sits between Home and the dashboards — added mid-project, is the primary navigation hub for a single launch)
- Editable description (inline edit/save/cancel) — currently anyone can edit this; consider restricting to launch lead in production.
- "Launch dashboard →" — routes to the current user's **own** personal dashboard (Priya → Daily Dashboard, Rohan → Compliance Dashboard, Ananya → Upstream Dashboard, Karan → Marketing Dashboard, custom role → Custom Dashboard).
- "Launch summary →" — only shown if the current user has `permSummary` on this launch's roster (or is launch_lead/admin, who always see it). Goes to the shared read-only Overview screen.
- "Retrospective →" — only shown if the launch is `closed` **and** the user has `permRetro` (or is launch_lead/admin).
- "Team, leadership & stakeholders →" — **launch lead only.** Opens the roster editor (see below).

### 6. Team, Leadership & Stakeholders (roster editor)
- Add a person: name, email, title (optional), a **group** dropdown (Leadership / Stakeholder / Team member / External), and two checkboxes (can view summary, can view retrospective).
- "Upload a team roster" — file input, described as AI-parsed (in the prototype this is stubbed/simulated).
- List of everyone currently on the launch, each row editable in place (name, group, role/function, permission checkboxes) with a remove (✕) button.
- Same component is reused for a **brand-new** launch's team step (starts empty) and for editing an existing launch's roster.
- **Access: launch lead only** — team members do not see this link at all.

### 7. Create a New Launch (3 steps, launch-lead only)
   a. **Details** — name, category, AI-assisted description field, links out to steps b/c with progress counters ("8 tasks configured" / "0 people added").
   b. **Checklist** — start from a saved template, upload a checklist file (AI-parsed in the prototype), or "Suggest tasks with AI" (stubbed). Each task: name, owner, duration in days, delete. Every new task defaults to status **"Not Started."**
   c. **Team** — same roster editor as above, starting empty.
   - Final confirmation screen → "Go to dashboard."

### 8. Daily Dashboard (Priya / launch_lead's personal working view)
- Header: launch name, risk badge, "Mark launch complete."
- Status pill row: counts of Not Started / On track / At risk / Blocked / Completed tasks.
- Three stat cards: Blocked tasks, Next milestone (name + due date), Open compliance flags.
- Left column: full checklist (click a row → Task Detail modal), "+ add task," subtasks routed to Priya (each with status dropdown, "keep with me," reassign, flag), and a free-text "Log a status update" note poster (posts directly into the accountability trail as unstructured text — separate from any structured status-change flow).
- Right column: Accountability trail preview (last 3 entries, "view all" → full Trail screen).

### 9. Task Detail (modal, opened from any dashboard's checklist)
- Status dropdown, owner dropdown, duration (days) — edit rights gated to the task's owner role or admin; others see "View only — you don't have edit access for this task."
- Risk reason code + comment (when status is at-risk/blocked).
- "Send to compliance for review" (routes a copy to the compliance queue).
- Subtasks: add a custom subtask with an assignee, each subtask has its own status dropdown, "Flag a concern," "keep with me," reassign.
- Recent activity log scoped to this task.

### 10. Flag a Concern (modal, from any task/subtask's "Flag a concern")
- Reason category dropdown, optional detail textarea (with an "AI-draft" assist button, stubbed), Cancel / Submit flag. Routes the concern back to the task's owner and logs it.

### 11. Accountability Trail
- Full chronological list of every status/date/compliance-flag change on the launch — system-recorded, not editable or deletable. Filterable by task via a dropdown ("All tasks" default). Non-owner roles see only entries touching their own tasks (`trailScopedEntries`); launch_lead/admin see everything.

### 12. Retrospective
- Only reachable once a launch is `closed`. Table of milestones: planned date vs. actual vs. slip (days), each requiring a root-cause tag before the retro can be saved (Save is disabled while any slip is untagged).

### 13. Launch Summary / Overview (shared, read-only, same for every role that has access)
- Overall progress %, at-risk/blocked count, next milestone, open compliance flag count, and the full stage-by-stage status table. No edit controls anywhere on this screen.

### 14. Marketing Dashboard (Karan — view only)
- Open task count, upstream blockers still open, "Listing live" status tile.
- "Your marketing tasks" (his own, view-only badges).
- "Upstream dependencies to watch" — tasks he depends on from other owners, with their risk reasons visible.

### 15. Upstream Dashboard (Ananya)
- Stat tiles: upstream tasks open, vendor lead time, buffer before rush order.
- "Upstream of you" task list (her own tasks, click to open Task Detail).
- "Compliance review updates" — read/reply thread with compliance on tasks she's touched.
- "Subtasks routed to you" — same subtask action pattern as the Daily Dashboard.
- **"Adjust vendor booking"** card: pick which external vendor is delayed (pulled from this launch's roster, `group === 'external'`), a reason code, and an extension-days number input (defaults to 3, editable) → "Adjust booking" applies it and shows a confirmation banner reflecting the actual vendor/reason/days chosen. Gated to `upstream_ops`/`launch_lead`/`admin`; others see a view-only lock notice. This represents renegotiating a vendor's production slot after a supply-chain slip.

### 16. Compliance Dashboard (Rohan)
- Stat tiles: open compliance flags, regulatory review status badge, days to submission deadline.
- "Sign-off queue" — tasks locked/finalized by their owner, awaiting compliance review.
- "Subtasks routed to you," "Reviewed tasks," and the full "Compliance flags" list (each with a Resolve action).
- "Submit compliance packet" button → **Compliance Packet Preview modal** (read-only summary: tasks reviewed, flags resolved/open, prepared-by/date) → Cancel or confirm submission (locks in `packetSubmitted: true`).

### 17. Custom Role Dashboard
- For any admin-created custom role (not one of the 5 built-in roles). Read-only: overall progress, next milestone, open compliance flags, all-stages table, recent activity. Scoped to the one launch the admin assigned them to (`assignedLaunchId`). "Switch launch" link and log out.

### 18. External View (minimal access)
- For `external` role users with an assigned launch: an intentionally sparse read-only view. (Not heavily built out in the prototype — treat as a stub to expand.)

### 19. No Assignment Yet
- Shown to any custom-role or external user who has no `assignedLaunchId` set. Static "waiting for an admin to assign you to a launch" message.

### 20. Admin — Manage User Roles
- `launch_lead` and `admin` only. Grant access to a new user by email + starting tier (Launch Owner / Team Member / External), search/filter existing users, change role/tier per user, revoke/restore access.

### 21. Legal Reviewer (stub)
- Static "view only" card — role exists in the data model but has no real screen built.

## Global Chrome
- Top nav (shown whenever logged in): "All launches" link, and a persona switcher (click your own name) containing:
  - **"Switch user (demo)"** — instant-swap to any other seeded user, no real logout. **Remove in production.**
  - "All launches," "My launches" (launch_lead only), "View retrospective" shortcut, "Manage user roles" (admin/launch_lead only), and "Log out."
  - In production this should just show the current user's name/avatar and a Log out action — no user list.

## Interactions & Behavior Notes
- **Status values**: `not_started` (displayed "Not Started"), `on track`, `at risk`, `blocked`, `completed`. New tasks always start at `not_started`.
- **Task ownership gates editing**: a task can only be edited by a user whose role matches `OWNER_ROLE[task.owner]` (a fixed mapping of the 4 default owner names — Priya/Rohan/Ananya/Karan — to their roles), or by `admin`. Everyone else sees a locked/view-only state on that task.
- **Roster permission gates viewing**, not editing: `permSummary`/`permRetro` per person per launch control whether the Summary/Retrospective links show on their Launch Detail screen. The roster itself can only be edited by the launch lead.
- **Retrospective and roster-edit links only ever show for the launch lead / closed launches respectively** — don't gate them purely on role name; gate on the actual permission/state fields described above, since a real implementation will likely have finer-grained roles than these 5 demo ones.
- **No real-time collaboration** — this is a single in-memory client with no websocket/polling. A production build needs real multi-user sync.
- A previous iteration of this feature (a shared "Chat-capture inbox" that parsed pasted vendor/Slack messages into structured status updates via AI, with per-role inline confirm cards) was **explicitly deferred out of MVP scope** — do not build it now; it's flagged as a fast-follow ("AI reads chat and proposes the structured update") once the manual/structured flow (task + status + reason-tag dropdowns, no parsing) has been validated.

## State Management (from the prototype — recreate the shape, not the implementation)
- `users`: id, name, initial, email, role, accessTier, employeeId, status (active/revoked), assignedLaunchId (for external/custom roles only).
- `launches[]`: id, name, category, description, closed (bool), createdAt, tasks[], complianceFlags[], trailEntries[], team[] (the roster), retroTags (map of milestone name → root cause), retroSaved, packetSubmitted, bookingAdjusted/bookingVendorName/bookingReasonLabel/bookingExtensionDays.
- `tasks[]` (per launch): id, name, owner, status, durationDays, blocks (bool — blocks downstream tasks), locked (bool), riskReason, riskComment, subtasks[].
- `team[]` (per launch, the roster): id, name, email, role/function, group (leadership/stakeholder/team/external), title, permSummary, permRetro.
- `complianceFlags[]`: id, name (description), task (which task it's tied to), status (open/resolved).
- `trailEntries[]`: id, initial, name, action, old, new, task, time — append-only, newest first.
- Navigation is a single `screen` string on the root component (`login`, `launches`, `launch-detail`, `dashboard`, `upstream`, `rohan`, `marketing`, `overview`, `trail`, `retro`, `admin`, `create`/`create-tasks`/`create-team`, `custom-dashboard`, `external-view`, `no-assignment`, `reset`) plus `currentUserId` and `currentLaunchId`. Recreate this as real routes (e.g. `/launches/:id`, `/launches/:id/dashboard`) rather than a single state string.

## Design Tokens (current prototype defaults — replace with your real system)
- **Background**: `#faf9f6` (page), `#fff` (cards)
- **Borders**: `#e5e2dc` (default), `#d8d4cc` (inputs), `#eeece7`/`#f0eeea` (dividers)
- **Text**: `#3d3a35` (body), `#55514a` (secondary), `#6b6862` (tertiary/links), `#8a857c` (muted), `#a6a29b` (faint)
- **Accent**: CSS var `--accent` (an indigo/blue, used for primary buttons/links)
- **Status colors**: On track/success `oklch(35-45% 0.1-0.13 150)` on `oklch(94% 0.04 150)` bg; At risk `oklch(40% 0.12 85)` on `oklch(95% 0.05 85)` bg; Blocked/error `oklch(45-50% 0.14-0.16 25)` on `oklch(94-95% 0.05 25)` bg; Not Started `#6b6862` on `#f3f1ec` bg
- **Radius**: 8px (buttons/inputs), 12px (cards), 14px (modals/auth cards), 999px (pills/avatars)
- **Shadow**: `0 1px 3px rgba(32,29,25,0.05)` (cards), `0 12px 32px rgba(32,29,25,0.14-0.2)` (modals)
- **Type**: system default sans-serif throughout; sizes range 11–22px; weights 600/700 for labels/headings, 400 for body

## Assets
No image assets — the design uses only text, colored pills/badges, and single-letter avatar initials on flat color backgrounds. No icon library; a few Unicode glyphs are used directly (←, →, ✕, 🔒, ✓, ✨, ⚠, ⏳, 💬, ▾, ◎, ▤, ↻, ⚙).

## Files in This Bundle
- `LaunchPilot.dc.html` — the full working prototype (open directly in a browser). This is the source of truth for exact copy, field names, and interaction order — refer back to it for anything this README doesn't spell out.
- `sample-launch-checklist.txt`, `sample-launch-checklist-with-timelines.txt` — example checklist upload formats the "upload your own checklist" feature is meant to parse.
- `sample-team-roster.txt` — example roster upload format the "upload a team roster" feature is meant to parse.
