import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@fish-admin/react'

const SECTIONS = [
  {
    title: 'Saved views in Pro Table',
    body: 'Column layouts, filters and sort order can now be stored as a named view. Views are private by default and can be shared with a team from the view menu. The active view is restored when you return to the page.',
  },
  {
    title: 'Faster query filters',
    body: 'Filter chips are debounced at 250 ms instead of 400 ms, and the filter bar no longer remounts when a row is selected. On large tables this removes the flicker that appeared while typing a search term.',
  },
  {
    title: 'Breaking change: Date Picker',
    body: 'Date Picker now returns a YYYY-MM-DD string instead of a Date object. Projects that compared Date instances need to switch to string comparison, or convert at the data boundary before passing values in.',
  },
  {
    title: 'Accessibility fixes',
    body: 'Dialog and Alert Dialog now return focus to the element that opened them after Escape. Icon-only buttons in the table toolbar gained accessible names, and the sidebar toggle announces its expanded state.',
  },
  {
    title: 'Upgrade notes',
    body: 'Update the package, run the codemod, then check any custom Date Picker wrappers. The migration guide lists every renamed prop. No database or API changes are required for this release.',
  },
] as const

export default function DialogLongContent() {
  return (
    <div className="fish-demo-stack">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            View release notes
          </Button>
        </DialogTrigger>
        <DialogContent style={{ maxHeight: '20rem', overflowY: 'auto' }}>
          <DialogHeader>
            <DialogTitle>Release 0.2.0</DialogTitle>
            <DialogDescription>
              Five changes shipped on 2026-10-14. The content scrolls inside the dialog instead of
              stretching it down the page.
            </DialogDescription>
          </DialogHeader>
          <div className="fish-demo-stack" style={{ maxWidth: '100%', gap: '1rem' }}>
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{section.title}</h3>
                <p className="fish-demo-muted" style={{ margin: '0.35rem 0 0' }}>
                  {section.body}
                </p>
              </section>
            ))}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button size="sm">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <p className="fish-demo-muted">
        The dialog body has a max-height of 20rem; longer content scrolls instead of growing past
        the viewport.
      </p>
    </div>
  )
}
