import type { SupabaseClient } from "@supabase/supabase-js";

const LAST_SEEN_KEY = "aura:lastSeenAt";

function getTimeoutMs(): number {
  // Default: 6 hours. Override with VITE_SESSION_TIMEOUT_MINUTES if you want.
  const raw = import.meta.env.VITE_SESSION_TIMEOUT_MINUTES as string | undefined;
  const minutes = raw ? Number(raw) : 6 * 60;
  if (!Number.isFinite(minutes) || minutes <= 0) return 6 * 60 * 60 * 1000;
  return minutes * 60 * 1000;
}

export function touchLastSeen() {
  try {
    localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
  } catch {
    // ignore storage errors (private mode, etc)
  }
}

export function isSessionStale(): boolean {
  try {
    const raw = localStorage.getItem(LAST_SEEN_KEY);
    if (!raw) return false; // if we never tracked it, don't force logout
    const last = Number(raw);
    if (!Number.isFinite(last)) return false;
    return Date.now() - last > getTimeoutMs();
  } catch {
    return false;
  }
}

export async function logoutIfStale(supabase: SupabaseClient) {
  if (!isSessionStale()) return;
  try {
    await supabase.auth.signOut();
  } finally {
    // reset tracking so we don't loop on every render
    touchLastSeen();
  }
}


