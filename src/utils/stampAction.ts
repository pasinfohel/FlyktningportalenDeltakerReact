export type StampAction = "inn" | "ut";

const PENDING_ACTION_KEY = "fp_pending_stamp_action";

function getSearchParams(): URLSearchParams | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search);
}

export function parseStampActionFromUrl(): StampAction | null {
  const params = getSearchParams();
  if (!params) return null;
  const action = (params.get("action") ?? "").toLowerCase();
  if (action === "inn" || action === "ut") return action;
  return null;
}

export function setPendingStampAction(action: StampAction): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_ACTION_KEY, action);
}

export function getPendingStampAction(): StampAction | null {
  if (typeof window === "undefined") return null;
  const stored = window.sessionStorage.getItem(PENDING_ACTION_KEY);
  if (stored === "inn" || stored === "ut") return stored;
  return null;
}

export function clearPendingStampAction(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_ACTION_KEY);
}

export function clearStampActionParamsFromUrl(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const keysToDelete = ["action", "kiosk", "ts", "sig"];
  keysToDelete.forEach((key) => url.searchParams.delete(key));
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}
