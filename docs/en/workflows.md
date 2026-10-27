# Approval center

The approval center is a worked example of a multi-step business flow: a request moves through a fixed chain of approvers, every decision is appended to a timeline, and the UI decides nothing on its own. `/workflows` lists requests; `/workflows/$id` shows the form snapshot, timeline, comments and the decision panel.

> The chain is adjudicated by the mock handler in the browser. That is a demonstration of the contract, not a security boundary. A real backend must re-run every check inside a database transaction — see [Production notes](#production-notes).

## Where things live

| Concern        | Files                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Types          | `src/types/workspace.ts` (`WorkflowInstanceRecord`, `WorkflowStep`, `WorkflowComment`) |
| Client API     | `src/features/workflows/api.ts`, `queries.ts`, `search.ts`                             |
| UI             | `src/features/workflows/components/*`                                                  |
| Routes         | `src/routes/_app/workflows.tsx`, `src/routes/_app/workflows_.$id.tsx`                  |
| Mock rules     | `src/mocks/handlers/workflows.ts`, `src/mocks/seed-workflows.ts`                       |
| Permissions    | `workflow:read`, `workflow:approve` in `src/config/permissions.ts`                     |
| Menu and icons | `src/config/nav.ts`, `src/features/navigation/menu-icons.ts` (`workflow`)              |

## Routes and views

| View            | Query          | Shows                                                          |
| --------------- | -------------- | -------------------------------------------------------------- |
| Initiated by me | `view=mine`    | Requests whose `initiatorId` is the signed-in user             |
| Waiting for me  | `view=pending` | Open requests where the current chain step is the current user |
| All approvals   | `view=all`     | Every request the role can read                                |

The search, status, type, initiator and date range live in the URL, so reloading and sharing a filtered link behaves the same. Entering `/workflows` without parameters lands on `page=1&pageSize=10&view=pending`.

The decision panel only renders when all three are true: the request is `pending`, the current chain step belongs to the signed-in user, and the session carries `workflow:approve`. The server repeats the same checks; a request that arrives out of turn gets `403 NOT_YOUR_TURN`, and a closed request gets `409 WORKFLOW_CLOSED` even if the button was somehow shown.

## API contract

All endpoints require `Authorization: Bearer <access token>` and `workflow:read`; decisions additionally require `workflow:approve`.

### `GET /workflows`

| Parameter     | Notes                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| `view`        | `mine`, `pending` or `all`; unknown values fall back to `all`          |
| `status`      | `pending`, `approved` or `rejected`                                    |
| `type`        | `purchase`, `leave`, `seal` or `change`                                |
| `initiatorId` | Exact initiator match                                                  |
| `from`, `to`  | `yyyy-MM-dd`; inclusive, applied to `createdAt`                        |
| `q`           | Case-insensitive match on code, title, summary, initiator or approvers |
| `page`        | 1-based; clamped to the available page count                           |
| `pageSize`    | Clamped to `10…100`, default `10`                                      |

Returns `PaginatedResult<WorkflowInstance>`, sorted by `updatedAt` descending and then by code. Invalid status, type or date input returns `400 VALIDATION_ERROR` / `400 INVALID_DATE_RANGE`.

### `GET /workflows/:id`

Returns `{ instance, steps, comments }`. Steps and comments are sorted oldest first. A missing id returns `404 WORKFLOW_NOT_FOUND`.

### `POST /workflows/:id/decisions`

Body: `{ decision: 'approve' | 'reject' | 'transfer', comment?, transferToId? }`.

| Decision   | Effect                                                                                  |
| ---------- | --------------------------------------------------------------------------------------- |
| `approve`  | Appends an `approved` step. The chain advances; the final step sets `status: approved`. |
| `reject`   | Appends a `rejected` step and closes the request as `rejected`.                         |
| `transfer` | Replaces the approver at the current step; the chain position does not move.            |

`comment` is optional and trimmed; blank input is stored as no note. `transferToId` must be an active user whose role carries `workflow:approve`, and cannot be the acting approver. Approve and reject write a `workflow.approved` / `workflow.rejected` audit event; transfer writes `workflow.transferred`. The response is the updated `WorkflowDetail`, so the client can render the new state without a second round trip.

### `POST /workflows/:id/comments`

Body: `{ body }`, 1–1000 characters after trimming. Returns the full comment list for that request. Any session with `workflow:read` may comment; the mock does not invent a separate comment permission.

### `GET /workflows/approvers`

Active users whose role includes `workflow:approve`, sorted by name. The detail page uses it for the transfer picker and filters out the current approver.

## The chain, precisely

An instance stores `approverIds` (the chain), `currentStep` (the position waiting on a decision) and a derived `status`.

- Submitting appends a `submitted` step at `currentStep = 0`.
- Approving increments `currentStep`. When it reaches `approverIds.length`, the request is `approved` and `completedAt` is stamped.
- Rejecting does not advance the chain; it closes the request and stamps `completedAt`.
- Transferring rewrites `approverIds[currentStep]` and appends a `transferred` step with the new approver. The timeline records both the actor and the target.
- Closed requests reject every further decision.

The seed in `src/mocks/seed-workflows.ts` replays exactly this logic, so a timeline can never disagree with the stored status.

## Data and the mock database

The mock database version is `5`. The migration from v4 adds `workflows`, `workflowSteps` and `workflowComments` and replays the demo chain against the users already in storage. Existing users, roles, sessions and workspace data are kept, and the demo manager role gains the two workflow permission codes. A v1–v3 store migrates through the same chain. Clearing `fish-admin:db:v1` from `localStorage` resets everything to the shipped seed.

The seed ships eight requests: four pending (including one two-step chain and one waiting on a different approver), three approved and one rejected, with comments on three of them. `WF-2026-0142` is the one-step request waiting on the admin account used by the e2e suite.

## Production notes

The client is deliberately thin, because none of it is trustworthy:

- **Re-check, then mutate, in one transaction.** Re-read the instance with a row lock (or compare a version column), confirm `status = pending` and that the caller is the approver for `currentStep`, then append the step, update the instance and write the audit record. Two approval requests racing on the same step must not both succeed.
- **Own the timeline.** Steps are append-only; never let a client send `currentStep`, `status` or timestamps. The payload above only names a decision and an optional note.
- **Validate the transfer target server-side.** "This user can approve" is a role check plus an active status, not a client-supplied flag.
- **Audit in the same transaction.** The audit log is the evidence that a decision happened; a failed write should roll back the decision, not leave a gap.
- **Authorize reads per record.** The mock returns `view=all` to anyone with `workflow:read`; a real system usually scopes that by department, project or tenancy. The three views are a UX affordance, not an authorization model.
- **Treat client-side RBAC as a UX layer only.** Hiding a button or redirecting to `/403` prevents confusion; it does not prevent requests. See [RBAC](./rbac.md).

## Testing

- `e2e/workflows.spec.ts` — admin approves `WF-2026-0142` (status, timeline, reload, audit event); viewer has no menu entry and lands on `/403`.
- `src/mocks/db/migrate.test.ts` — v4 → v5 keeps existing data, seeds the chain, and merges the new permission codes.
- Visual baselines — `workflows.png` (pending queue) and `approval-detail.png` (timeline, snapshot, decision panel).
