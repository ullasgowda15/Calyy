const BROWSER_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

const TIME_OPT = { hour: '2-digit', minute: '2-digit', hour12: true };

const FALLBACK_TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'America/Mexico_City',
  'America/Argentina/Buenos_Aires', 'America/Puerto_Rico', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Europe/Moscow', 'Europe/Stockholm', 'Europe/Istanbul',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore',
  'Asia/Hong_Kong', 'Asia/Seoul', 'Asia/Karachi', 'Asia/Bangkok', 'Asia/Jakarta',
  'Asia/Taipei', 'Asia/Manila', 'Asia/Tehran', 'Asia/Colombo', 'Asia/Riyadh',
  'Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth',
  'Pacific/Auckland', 'Pacific/Fiji', 'Africa/Cairo', 'Africa/Lagos',
  'Africa/Johannesburg', 'Africa/Nairobi',
];

export const ALL_TIMEZONES = (() => {
  try {
    const supported = Intl.supportedValuesOf('timeZone');
    if (supported && supported.length > 0) return supported;
  } catch {}
  return FALLBACK_TIMEZONES;
})();

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
