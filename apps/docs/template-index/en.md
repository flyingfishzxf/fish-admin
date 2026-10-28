---
title: Template
description: The FishAdmin admin template, the library's first consumer.
---

# Template

The template is the library's first consumer and its living example. It is a complete admin
application — routing, authentication, a mock API, dictionaries, audit logs and permission-aware
navigation — built from the same components documented here.

![FishAdmin dashboard](/screenshots/dashboard.png)

## Entry points

- **Live demo:** <https://fish-admin.vercel.app>
- **Source:** <https://github.com/flyingfishzxf/fish-admin>
- **Demo accounts:** the login page lists the administrator, manager and viewer accounts.

## What this section covers

The pages in this section describe how the application is assembled: startup and routing, the API
contract, tables, workflows, dictionaries, account lifecycle, deployment and scaffolding.

**Client-side RBAC in the template is a UX layer, not a security boundary.** It decides what the
interface shows. Every request is still answered by the API, so a production deployment must
authorize on the server.

The template is also a scaffold: `pnpm scaffold` removes the mock API, extra languages or demo
accounts while keeping the package dependency and the component library intact.
