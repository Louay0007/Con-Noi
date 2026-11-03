import { useEffect } from "react";

const SUFFIX = "Con noi";

/**
 * Sets the document title for a screen.
 *
 * Only the landing page had a title before, so every other route showed the
 * landing title in the tab, in browser history and in shared links.
 */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = title.includes(SUFFIX) ? title : `${title} — ${SUFFIX}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
