import React, { useEffect, useState } from 'react';
import { useSpacetimeDB, useTable } from 'spacetimedb/react';
import { Identity, Timestamp } from 'spacetimedb';
import { tables } from '../module_bindings';
import { ENABLE_USER_SESSION_METRICS } from '../config/featureFlags';
import './SessionWidget.css';

function formatDuration(ms: number) {
  if (ms < 1000) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function SessionWidget() {
  const { identity, isActive } = useSpacetimeDB();
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [sessionCount, setSessionCount] = useState<number | null>(null);

  // Subscribe to server-side view if available.
  // The generated bindings may not include `my_session_metrics` in all
  // module versions. To keep builds resilient, access the binding via
  // a runtime any-cast and fall back to an existing table if it's
  // missing so the hook call order remains stable.
  const metricsTable: any = (tables as any).my_session_metrics ?? (tables as any).user;
  const [metrics] = useTable(metricsTable as any);

  useEffect(() => {
    if (!ENABLE_USER_SESSION_METRICS) return;
    if (!identity) return;

    // If server view returns a row, prefer it
    const row = metrics && metrics.length > 0 ? metrics[0] as any : null;
    if (row && row.sessionCount !== undefined) {
      setSessionCount(Number(row.sessionCount));
      if (row.connectedAt) {
        try {
          const micros: bigint = (row.connectedAt as Timestamp).microsSinceUnixEpoch;
          const ms = Number(micros / 1000n);
          setConnectedAt(ms);
        } catch {
          setConnectedAt(null);
        }
      } else {
        setConnectedAt(null);
      }
      return;
    }

    // Fallback to sessionStorage/localStorage behavior (per-tab + per-browser)
    const id = identity.toHexString();
    const startedKey = `session_connected_at_${id}`; // set in main.tsx onConnect
    const countKey = `session_count_${id}`;
    const storedStarted = sessionStorage.getItem(startedKey);
    if (storedStarted) {
      setConnectedAt(Number(storedStarted));
    } else if (isActive) {
      const nowTs = Date.now();
      sessionStorage.setItem(startedKey, String(nowTs));
      setConnectedAt(nowTs);
    }
    const storedCount = parseInt(localStorage.getItem(countKey) || '0', 10) || 0;
    setSessionCount(storedCount || null);
  }, [identity, isActive, metrics]);

  useEffect(() => {
    if (!ENABLE_USER_SESSION_METRICS) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!ENABLE_USER_SESSION_METRICS) return null;
  if (!identity) return null;

  return (
    <div className="session-widget">
      {connectedAt ? (
        <div className="session-item">Connected: {formatDuration(now - connectedAt)}</div>
      ) : (
        <div className="session-item">Not connected</div>
      )}
      <div className="session-item">Sessions: {sessionCount ?? '—'}</div>
    </div>
  );
}

export default SessionWidget;
