from datetime import datetime, timedelta, date, time
import pytz
from django.utils import timezone
from .models import Availability, BlockedTime
from bookings.models import Booking


import logging
logger = logging.getLogger(__name__)


def _safe_localize(tz, dt_val):
    try:
        return tz.localize(dt_val)
    except (pytz.NonExistentTimeError, pytz.AmbiguousTimeError):
        return tz.localize(dt_val, is_dst=False)


def get_available_slots(event_type, target_date: date, host_timezone: str = 'UTC') -> list:
    try:
        host_tz = pytz.timezone(host_timezone)
    except pytz.UnknownTimeZoneError:
        logger.warning(f'Unknown timezone "{host_timezone}", falling back to UTC')
        host_tz = pytz.utc

    now = timezone.now()
    min_dt = now + timedelta(minutes=event_type.min_notice)
    max_dt = now + timedelta(days=event_type.max_advance_days)

    weekday = target_date.weekday()

    availability_windows = Availability.objects.filter(
        user=event_type.host,
        weekday=weekday,
        is_active=True,
    )

    if not availability_windows.exists():
        return []

    slots = []
    slot_duration = timedelta(minutes=event_type.duration)
    buffer_before = timedelta(minutes=event_type.buffer_before)
    buffer_after = timedelta(minutes=event_type.buffer_after)

    day_start_host = _safe_localize(host_tz, datetime.combine(target_date, time.min))
    day_end_host = _safe_localize(host_tz, datetime.combine(target_date, time.max))
    day_start_utc = day_start_host.astimezone(pytz.utc)
    day_end_utc = day_end_host.astimezone(pytz.utc)

    existing_bookings = Booking.objects.filter(
        event_type__host=event_type.host,
        start_datetime__gte=day_start_utc,
        start_datetime__lt=day_end_utc,
        status__in=['confirmed', 'pending'],
    ).values('start_datetime', 'end_datetime')

    blocked_times = BlockedTime.objects.filter(
        user=event_type.host,
        start_datetime__lt=day_end_utc,
        end_datetime__gt=day_start_utc,
    ).values('start_datetime', 'end_datetime')

    try:
        from integrations.models import GoogleCalendarToken
        from integrations.google_calendar import get_busy_slots
        google_token = GoogleCalendarToken.objects.get(user=event_type.host)
        google_busy = get_busy_slots(google_token, day_start_utc, day_end_utc)
        for busy in google_busy:
            def _parse_gc_dt(s):
                s = s.replace('Z', '+00:00').replace('+00:00+00:00', '+00:00')
                return pytz.utc.localize(datetime.fromisoformat(s)) if 'T' in s else pytz.utc.localize(datetime.combine(datetime.fromisoformat(s).date(), time.min))
            blocked_times = list(blocked_times) + [{
                'start_datetime': _parse_gc_dt(busy['start']),
                'end_datetime': _parse_gc_dt(busy['end']),
            }]
    except (GoogleCalendarToken.DoesNotExist, ImportError):
        pass

    if event_type.max_bookings_per_day:
        confirmed_today = Booking.objects.filter(
            event_type__host=event_type.host,
            start_datetime__gte=day_start_utc,
            start_datetime__lt=day_end_utc,
            status='confirmed',
        ).count()
        if confirmed_today >= event_type.max_bookings_per_day:
            return []

    for window in availability_windows:
        window_start = _safe_localize(host_tz, datetime.combine(target_date, window.start_time))
        window_end = _safe_localize(host_tz, datetime.combine(target_date, window.end_time))

        current = window_start
        while current + slot_duration <= window_end:
            slot_start_utc = current.astimezone(pytz.utc)
            slot_end_utc = (current + slot_duration).astimezone(pytz.utc)
            effective_start = slot_start_utc - buffer_before
            effective_end = slot_end_utc + buffer_after

            if slot_start_utc < min_dt:
                current += timedelta(minutes=15)
                continue

            if slot_start_utc > max_dt:
                break

            conflict = False
            for booking in existing_bookings:
                b_start = booking['start_datetime']
                b_end = booking['end_datetime']
                b_effective_start = b_start - buffer_before
                b_effective_end = b_end + buffer_after
                if b_effective_start < slot_end_utc and b_effective_end > slot_start_utc:
                    conflict = True
                    break

            if not conflict:
                for block in blocked_times:
                    b_start = block['start_datetime']
                    b_end = block['end_datetime']
                    if b_start < slot_end_utc and b_end > slot_start_utc:
                        conflict = True
                        break

            if not conflict:
                slots.append({
                    'start': slot_start_utc.isoformat(),
                    'end': slot_end_utc.isoformat(),
                })

            current += timedelta(minutes=15)

    return slots
