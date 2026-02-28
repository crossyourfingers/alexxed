import { useState, useEffect } from 'react';
import { useSpacetimeDB, useTable } from 'spacetimedb/react';
import { tables, DbConnection } from '../../module_bindings';
import type { LinkPreviewData } from './types';
import './Chat.css';

interface LinkPreviewProps {
  url: string;
}

// In-memory cache for pending fetches (prevents duplicate requests)
const pendingFetches = new Set<string>();

export function LinkPreview({ url }: LinkPreviewProps) {
  const ctx = useSpacetimeDB();
  const [linkPreviews] = useTable(tables.link_preview);
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Check SpacetimeDB table for cached preview
  const cachedPreview = linkPreviews.find((p) => p.url === url);

  useEffect(() => {
    // If we have a cached preview from SpacetimeDB, use it
    if (cachedPreview) {
      setPreview({
        url: cachedPreview.url,
        title: cachedPreview.title,
        description: cachedPreview.description,
        image: cachedPreview.image,
      });
      setLoading(false);
      setError(false);
      return;
    }

    // Otherwise, fetch via SpacetimeDB procedure
    let cancelled = false;

    async function fetchPreview() {
      // Prevent duplicate fetches
      if (pendingFetches.has(url)) {
        return;
      }

      const conn = ctx.getConnection() as DbConnection | null;
      if (!conn) {
        // Not connected yet, wait
        return;
      }

      setLoading(true);
      setError(false);
      pendingFetches.add(url);

      try {
        // Call the SpacetimeDB procedure to fetch and cache the preview
        const result = await conn.procedures.fetchLinkPreview({ url });
        
        if (!cancelled && result) {
          setPreview({
            url: result.url,
            title: result.title,
            description: result.description,
            image: result.image,
          });
          setLoading(false);
        }
      } catch (err) {
        console.warn('Failed to fetch link preview via SpacetimeDB:', err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      } finally {
        pendingFetches.delete(url);
      }
    }

    fetchPreview();
    return () => {
      cancelled = true;
    };
  }, [url, cachedPreview, ctx]);

  // Don't render anything if there's an error or no preview
  if (error || (!loading && !preview)) {
    return null;
  }

  if (loading) {
    return (
      <div className="link-preview-loading">
        Loading preview...
      </div>
    );
  }

  if (!preview) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-preview"
    >
      {preview.image && (
        <img
          src={preview.image}
          alt=""
          className="link-preview-image"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
      <div className="link-preview-content">
        <div className="link-preview-title">{preview.title || 'No title'}</div>
        {preview.description && (
          <div className="link-preview-description">{preview.description}</div>
        )}
        <div className="link-preview-url">{new URL(url).hostname}</div>
      </div>
    </a>
  );
}
