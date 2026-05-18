export function formatDateTimeUTC(isoString, timezone = 'UTC') {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateLocal(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTimeLocal(isoString, timezone = 'UTC') {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toLocalISOString(isoString, timezone = 'UTC') {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', { timeZone: timezone });
}

export function getUserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
