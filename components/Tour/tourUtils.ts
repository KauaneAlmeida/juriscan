/**
 * Finds the first visible element matching the given selector.
 *
 * When duplicate elements exist in the DOM (e.g. desktop sidebar hidden via
 * `display:none` and mobile sidebar visible inside a drawer), a plain
 * `querySelector` returns the first match in source order which may be the
 * hidden one.  This helper iterates all matches and returns the first one
 * whose bounding rect has non-zero dimensions, i.e. the one actually visible
 * on screen.
 */
export function findVisibleElement(selector: string): Element | null {
  const elements = document.querySelectorAll(selector);
  if (elements.length === 0) return null;

  for (let i = 0; i < elements.length; i++) {
    const rect = elements[i].getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return elements[i];
    }
  }

  // Fallback: return the first element even if hidden (better than nothing)
  return elements[0];
}
