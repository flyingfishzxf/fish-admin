# @fish-admin/vue

Vue 3 components and design tokens for the FishAdmin admin template — the Vue
port of [`@fish-admin/react`](../ui). Everything is styled with Tailwind 4
utility classes and themed through CSS variables, so light/dark and the five
accent colours come from the stylesheet, not from JavaScript.

## Install

```bash
npm install @fish-admin/vue
```

## Use

```ts
// main.ts
import '@fish-admin/vue/styles.css'
import { createApp } from 'vue'
import { Button } from '@fish-admin/vue'
```

No Tailwind setup, no token files — `styles.css` ships the compiled utilities the
components use plus the theme variables. Switch themes with the same attributes
the admin template uses:

```html
<html data-theme="dark" data-accent="violet"></html>
```

If your project already runs Tailwind 4 and wants to re-skin through the token
sources, import the stylesheet source instead and compile it yourself:

```ts
import '@fish-admin/vue/styles/index.css'
```

## Components (v0.5.0 — 54 exports)

Accordion, Alert, AlertDialog, Avatar, Badge, BulkActionsBar, Button, Card,
Checkbox, Collapsible, ColorPicker, DataTable, DateRangePicker, Descriptions,
Dialog, DropdownMenu, Dropzone, EmptyState, ErrorState, Input, InputNumber,
JsonViewer, Label, List, LoadingOverlay, OtpInput, PageHeader, Pagination,
Popconfirm, Popover, PopoverPrimitive helpers, ProgressBar, ProTable, RadioGroup,
Result, ScrollArea, Segmented, Select, Separator, Skeleton, Slider, Spinner,
Stepper, Statistic, Switch, Tabs, TagsInput, Textarea, Timeline, Trend — the
surfaces the admin template needs, plus AnchorNav, BackTop, Breadcrumb,
HoverCard and PageContainer. The remaining components of the 83-component React
library are on the roadmap
(`docs/superpowers/specs/2026-11-16-vue-package-installable-checklist.md`).

## Peer dependencies

- `vue ^3.5`
