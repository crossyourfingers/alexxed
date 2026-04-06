import { useState, useEffect, useRef } from "react";

const cache = new Map<string, string | null>();

/**
 * Fetches a Wikipedia thumbnail for a given game title.
 * Returns the image URL (or null if not found / still loading).
 * Results are cached in a module-level Map to avoid duplicate requests.
 */
export function useWikipediaImage(title: string | undefined): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(
    title ? (cache.get(title) ?? null) : null,
  );
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!title) return;
    if (cache.has(title)) {
      setImageUrl(cache.get(title) ?? null);
      return;
    }
    if (fetchedRef.current === title) return;
    fetchedRef.current = title;

    const encoded = encodeURIComponent(title);
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const url = data?.thumbnail?.source ?? null;
        cache.set(title, url);
        setImageUrl(url);
      })
      .catch(() => {
        cache.set(title, null);
      });
  }, [title]);

  return imageUrl;
}
