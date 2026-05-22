const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

const TIME_OPT = { hour: '2-digit', minute: '2-digit', hour12: true };

export function formatDateTimeUTC(isoString, timezone = BROWSER_TZ) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...TIME_OPT,
  });
}

export function formatDateLocal(isoString, timezone = BROWSER_TZ) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTimeLocal(isoString, timezone = BROWSER_TZ) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { ...TIME_OPT, timeZone: timezone });
}

export function toLocalISOString(isoString, timezone = 'UTC') {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', { timeZone: timezone });
}

export function getUserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function resolveTimezone(userTz) {
  return userTz && userTz !== 'UTC' ? userTz : getUserTimezone();
}
