# Access And Permissions

This document explains how access control works in the CRM, where each part of
the system lives, and how to add or debug a permission safely.

The short version:

- A user has one role, stored on `models/User.ts`.
- A role receives many permissions in the format `resource.action`.
- The four supported actions are `view`, `post`, `update`, and `delete`.
- `owner` always has full access and cannot be restricted.
- `admin` can access all data, but only for resources/actions granted to the
  admin role.
- Other roles can only see dashboard areas that are allowed for member users,
  and their data is scoped to records related to themselves.
- UI permissions hide tabs, buttons, and table actions.
- API permissions enforce the same rules on the server.
- Data scopes enforce which records a user can read or mutate.

## Roles

Roles are defined in `lib/permissions.ts` and must match the enum in
`models/User.ts`.

Current roles:

| Role | Purpose |
| --- | --- |
| `owner` | Full system owner. Always has every permission and all data access. |
| `admin` | Operational admin. Can see all data only when the needed permission is granted. |
| `project_manager` | Delivery management, projects, tasks, members, reports. |
| `developer` | Personal task work and related workspace access. |
| `designer` | Personal task work and related workspace access. |
| `sales` | Leads, clients, and proposals. |
| `marketing` | Boards and campaign-style work. |
| `finance` | Finance tab, invoices, payments, expenses, reports. |
| `client` | Limited project/task visibility. |

## Permission Shape

Permissions are built from a resource and one of four actions:

```ts
`${resource}.${action}`
```

Examples:

```ts
tasks.view
tasks.post
tasks.update
tasks.delete
projects.view
finance.view
access.update
```

The four actions mean:

| Action | Meaning |
| --- | --- |
| `view` | Can see the tab, list, detail, or report data for a resource. |
| `post` | Can create a new record. |
| `update` | Can edit an existing record. |
| `delete` | Can remove an existing record. |

These actions are intentionally generic so the same logic can control
dashboard tabs, form submit buttons, table actions, command palette actions,
and API routes.

## Access Resources

The canonical resource list is `ACCESS_RESOURCES` in `lib/permissions.ts`.
Every resource in that list automatically gets the four action permissions.

Important examples:

| Resource | Typical UI/API area |
| --- | --- |
| `dashboard` | Main overview dashboard tab. |
| `my-work` is not a persisted resource | Visible by member dashboard rules, not currently in `ACCESS_RESOURCES`. |
| `leads` | Leads tab and `/api/leads`. |
| `clients` | Clients tab and `/api/clients`. |
| `proposals` | Proposals tab and `/api/proposals`. |
| `projects` | Projects tab and `/api/projects`. |
| `tasks` | Tasks tab and `/api/tasks`. |
| `finance` | Parent finance tab. |
| `invoices` | Invoice records. |
| `payments` | Payment records. |
| `operational-expenses` | Operational expense records. |
| `project-expenses` | Project expense records. |
| `team` | Parent team tab. |
| `users` | User records. |
| `team-member-profiles` | Member profile records. |
| `compensation-profiles` | Compensation records. |
| `reports` | Reports tab and `/api/reports`. |
| `access` | Access Manager tab and `/api/access/roles`. |
| `settings` | Settings tab and `/api/settings`. |

When adding a new model-backed feature, add its resource to
`ACCESS_RESOURCES`, then wire the API and UI to the generated permission.

## Default Role Permissions

`DEFAULT_ROLE_PERMISSIONS` in `lib/permissions.ts` is the fallback matrix.

The fallback is used when:

- no custom role permission document exists for the organisation;
- the role permission document has no valid permissions;
- the code asks for permissions without an `organisationId`.

`owner` receives `ALL_PERMISSIONS`.

`admin` receives all permissions except `access.*` by default. This means an
admin can operate the system broadly, but access-manager changes are reserved
unless an owner grants them.

Any role can be customized per organisation through the Access Manager tab.
Custom permissions are stored in `RolePermission` documents.

## Stored Role Overrides

`models/RolePermission.ts` stores custom permissions per organisation and role.

Important fields:

| Field | Meaning |
| --- | --- |
| `organisationId` | The organisation this custom matrix belongs to. |
| `role` | The role being customized. |
| `permissions` | The saved `resource.action` strings. |

There is a unique index on `{ organisationId, role }`, so each organisation has
at most one custom permission document per role.

The `owner` role is locked. The API rejects updates to owner permissions because
owner must always remain unrestricted.

## Permission Resolution Flow

The central resolver is `lib/permission-store.ts`.

`getPermissionsForRole(role, organisationId)` works like this:

1. If the role is `owner`, return `ALL_PERMISSIONS`.
2. If no `organisationId` is provided, return `DEFAULT_ROLE_PERMISSIONS[role]`.
3. Load `RolePermission` for `{ organisationId, role }`.
4. Keep only valid permission strings.
5. If a valid custom list exists, return it.
6. Otherwise return the default permissions for that role.

`requirePermission(...)` uses that resolved list and throws an
`AuthorizationError` when the user does not have the requested permission.

The error message is user-facing:

```txt
You do not have access to <permission>. Ask an owner to update your role permissions.
```

API routes return this as a structured error through `lib/api-response.ts`.

## Data Scope Rules

Permissions answer "can this role perform this action?"

Data scope answers "which records can this user touch?"

The data scope logic lives in `lib/data-scope.ts`.

Global data access:

| Role | Data scope |
| --- | --- |
| `owner` | All organisation data. |
| `admin` | All organisation data, if the required permission exists. |
| Any other role | Only records related to the current user. |

`hasGlobalDataAccess(role)` returns true only for `owner` and `admin`.

For non-global users, `createDataScopeResolver(session)` returns a model-specific
Mongo filter. Examples:

| Model | Non-global filter |
| --- | --- |
| `Task` | User is assignee, reporter, reviewer, or creator. |
| `Project` | User is owner, project manager, project member, related through their client/lead, or has related tasks. |
| `Payment` | `recordedBy` is the current user. |
| `Invoice` | `createdBy` is the current user. |
| `OperationalExpense` | `createdBy` is the current user. |
| `ProjectExpense` | User submitted or approved the expense. |
| `TeamMemberProfile` | `userId` is the current user. |
| `CompensationProfile` | `userId` is the current user. |
| `User` | `_id` is the current user. |

`mergeDataScope(baseFilter, scopeFilter)` combines organisation filters with
data-scope filters. This prevents non-global users from reading or mutating
records outside their own scope, even if they guess an API URL or record id.

## Dashboard Visibility

Dashboard tab visibility is handled in two layers:

1. `components/dashboard/sidebar.tsx`
2. `app/(dashboard)/dashboard/page.tsx`

Both use the same ideas:

- If session data is still loading, show skeleton navigation.
- If the role is `owner` or `admin`, allow global dashboard tabs according to
  permissions.
- For non-global roles, only allow tabs listed in
  `MEMBER_DASHBOARD_TAB_IDS`.
- If a nav item has a permission, the user must have that permission.

`MEMBER_DASHBOARD_TAB_IDS` currently allows member-style users to access only:

```ts
dashboard
my-work
tasks
finance
team
profile
```

This prevents a developer, designer, sales user, finance user, or client from
discovering every sidebar tab after a refresh. While session/permission data is
loading, the sidebar renders skeleton rows instead of showing all items.

## Frontend Enforcement

Frontend checks improve UX by hiding unavailable actions. They are not the only
security layer; API routes also enforce permissions.

Important frontend files:

| File | Responsibility |
| --- | --- |
| `lib/use-session.ts` | Fetches `/api/auth/me`, exposes the current session, permissions, role flags, and `can(permission)`. |
| `components/dashboard/sidebar.tsx` | Shows only allowed dashboard tabs and shows skeleton navigation while access data loads. |
| `app/(dashboard)/dashboard/page.tsx` | Computes visible tabs, prevents rendering inaccessible tabs, and falls back to the first allowed tab. |
| `components/dashboard/crud-tab.tsx` | Hides Create, Edit, and Delete actions based on `accessResource.post/update/delete`. Shows toast errors if an action is blocked. |
| `components/ui/dynamic-table.tsx` | Receives filtered table actions from parent components and renders the table responsively. |
| `components/dashboard/command-palette.tsx` | Shows only allowed navigation and quick actions, then uses `/api/search` for permission-aware global search. |
| `components/tabs/access-tab.tsx` | The Access Manager UI for changing permissions per role. Owner is locked. |
| `components/tabs/my-work-tab.tsx` | Shows a scoped personal workspace summary from `/api/my-work`. |

The UI should always use `can(buildPermission(resource, action))` or an
equivalent server-provided permission list before showing privileged buttons.

Example:

```tsx
const canDelete = can(buildPermission("tasks", "delete"));

return canDelete ? <DeleteButton /> : null;
```

## Backend Enforcement

Backend checks are required for every protected route.

Most CRUD endpoints use `lib/route-handler.ts`.

`createCrudHandlers(...)` handles:

- authentication;
- list permission checks;
- create permission checks;
- organisation scoping;
- data scoping;
- search/status filters;
- audit logs for creates.

`createDetailHandlers(...)` handles:

- authentication;
- get/update/delete permission checks;
- organisation scoping;
- data scoping;
- audit logs for updates and deletes.

Permission inference is based on model name:

| Model | Resource |
| --- | --- |
| `Task` | `tasks` |
| `Project` | `projects` |
| `Payment` | `payments` |
| `User` | `users` |
| `TeamMemberProfile` | `team-member-profiles` |

If a route passes explicit permissions, those override inferred permissions.

Example from `/api/tasks`:

```ts
const handlers = createCrudHandlers({
  model: async () => (await import("@/models/Task")).default,
  modelName: "Task",
  permissions: {
    list: PERMISSIONS.TASK_VIEW,
    create: PERMISSIONS.TASK_CREATE,
  },
});
```

Detail routes should use `createDetailHandlers(...)` so `PATCH` and `DELETE`
also pass through access checks and data scopes.

## Access Manager API

`app/api/access/roles/route.ts` is the API behind the Access Manager tab.

`GET /api/access/roles`:

- requires authentication;
- requires `access.view`;
- returns actions, resources, all permissions, role defaults, and active role
  permissions.

`PATCH /api/access/roles`:

- requires authentication;
- requires `access.update`;
- validates the role;
- rejects updates for `owner`;
- validates every permission string;
- upserts the role's custom permission document for the current organisation.

After saving, the UI invalidates both `access-rules` and `session` queries so
the dashboard can react without a full page refresh.

## Auth And Session

`lib/auth.ts` owns the session cookie and JWT payload.

The session payload includes:

```ts
{
  userId: string;
  organisationId: string;
  role: Role;
  email: string;
  name: string;
}
```

`requireAuth()` is used by API routes that need a logged-in user.

`requireAuthWithPermission(permission)` is a convenience helper that authenticates
and immediately checks a permission.

`/api/auth/me` returns the current session plus resolved permissions. The client
side `useSession()` hook depends on this endpoint.

## Search And My Work

`app/api/search/route.ts` powers global search.

It:

- requires authentication;
- loads the current role permissions;
- skips resources where the user lacks `<resource>.view`;
- restricts non-global users to member-safe resources;
- applies `createDataScopeResolver(session)` before querying;
- returns a small normalized result list with target tabs.

`app/api/my-work/route.ts` powers the My Work tab.

It:

- requires authentication;
- resolves role permissions;
- applies role-aware data scopes;
- returns task counts, priority tasks, overdue tasks, finance summaries, and
  team/profile information.

For `owner` and `admin`, My Work can summarize global organisation data. For
other roles, it only summarizes data related to the signed-in user.

## Reports

`app/api/reports/route.ts` is the reporting endpoint.

Reports should follow the same pattern:

- authenticate first;
- require `reports.view`;
- check the selected report resource permission where applicable;
- apply data scope filters for the selected model;
- return only records the user is allowed to inspect.

This matters because reports can expose cross-model information. A report must
never bypass `requirePermission` or `createDataScopeResolver`.

## Error Handling

`lib/api-response.ts` standardizes API responses.

Success:

```json
{
  "success": true,
  "data": {},
  "requestId": "req_..."
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "You do not have access to tasks.delete. Ask an owner to update your role permissions.",
    "details": {}
  },
  "requestId": "req_..."
}
```

Client helpers such as `lib/use-crud.ts` read this format and show the error
message in a toast. This gives users a clear reason when an action is blocked.

## Adding A New Protected Feature

Use this checklist when adding a new feature.

1. Add the resource to `ACCESS_RESOURCES` in `lib/permissions.ts`.
2. Confirm the generated `PERMISSIONS.<RESOURCE>_<ACTION>` names compile.
3. Add defaults in `DEFAULT_ROLE_PERMISSIONS`.
4. Add or update the model-to-resource mapping in `lib/route-handler.ts`.
5. Add a data scope rule in `lib/data-scope.ts` if non-global users should not
   see all records.
6. Protect list/create routes with `createCrudHandlers(...)` or explicit
   `requirePermission(...)`.
7. Protect detail/update/delete routes with `createDetailHandlers(...)` or
   explicit `requirePermission(...)`.
8. Pass `accessResource` into `CrudTab` so Create/Edit/Delete buttons are hidden
   correctly.
9. Add sidebar navigation with the correct `permission`.
10. If the feature should appear in global search, add it to
    `app/api/search/route.ts`.
11. If the feature should appear in reports, make sure the report path applies
    both permission and data scope.

## Debugging Access Problems

When a user cannot see data or an action:

1. Check the user's role in `models/User.ts` data.
2. Check `/api/auth/me` and confirm the permission is present.
3. Check Access Manager for custom role overrides.
4. If no custom override exists, check `DEFAULT_ROLE_PERMISSIONS`.
5. Check whether the sidebar item has a `permission`.
6. Check whether the component passes `accessResource` to `CrudTab`.
7. Check the API route permission mapping.
8. Check `lib/data-scope.ts`; the user may have permission but no matching
   scoped records.
9. Check the API error response `requestId` in logs.

The most common distinction is:

- Missing permission means the user cannot perform the action.
- Data scope mismatch means the user can perform the action, but only on zero
  matching records.

## Security Rules

Keep these rules intact:

- Never restrict `owner`.
- Never rely only on hidden UI controls.
- Always enforce permissions on the API.
- Always merge organisation filters with data scopes.
- Never return all organisation data to non-global roles unless that is an
  intentional, reviewed business rule.
- Treat `admin` as global data access only after the requested permission passes.
- Use `requestId` when debugging access errors.
