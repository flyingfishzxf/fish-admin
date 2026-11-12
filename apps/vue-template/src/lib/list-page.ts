/**
 * Keeps a requested page inside the page count reported by the API.
 *
 * Placeholder data belongs to the previous query key, so it must not influence
 * the current page: skipping it prevents a normal next/previous navigation from
 * being pulled backwards by the outgoing response.
 */
export function clampToPageCount(
  currentPage: number,
  pageCount: number | undefined,
  isPlaceholder = false,
): number {
  if (isPlaceholder || pageCount === undefined) return currentPage
  const lastPage = Math.max(pageCount, 1)
  return currentPage > lastPage ? lastPage : currentPage
}
