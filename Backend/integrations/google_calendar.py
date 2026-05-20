import json
import logging
from datetime import datetime
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


SCOPES = ['https://www.googleapis.com/auth/calendar']


def get_credentials(google_token) -> Credentials | None:
    creds = Credentials(
        token=google_token.access_token,
        refresh_token=google_token.refresh_token,
        token_uri='https://oauth2.googleapis.com/token',
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=SCOPES,
    )
    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            google_token.access_token = creds.token
            google_token.token_expiry = creds.expiry
            google_token.save()
        except Exception as e:
            logger.error(f'Failed to refresh Google token: {e}')
            return None
    elif creds.expired and not creds.refresh_token:
        logger.error('Google token expired and no refresh token available')
        return None
    return creds


def get_busy_slots(google_token, date_min: datetime, date_max: datetime) -> list:
    try:
        creds = get_credentials(google_token)
        service = build('calendar', 'v3', credentials=creds)
        body = {
            'timeMin': date_min.isoformat(),
            'timeMax': date_max.isoformat(),
            'items': [{'id': google_token.calendar_id}],
        }
        result = service.freebusy().query(body=body).execute()
        busy = result.get('calendars', {}).get(google_token.calendar_id, {}).get('busy', [])
        return busy
    except Exception:
        return []


def create_calendar_event(google_token, booking) -> str:
    try:
        creds = get_credentials(google_token)
        if not creds:
            return ''
        service = build('calendar', 'v3', credentials=creds)
        event = {
            'summary': f'{booking.event_type.name} with {booking.invitee_name}',
            'description': f'Booking ID: {booking.id}\nInvitee email: {booking.invitee_email}',
            'start': {'dateTime': booking.start_datetime.isoformat(), 'timeZone': 'UTC'},
            'end': {'dateTime': booking.end_datetime.isoformat(), 'timeZone': 'UTC'},
            'attendees': [
                {'email': booking.invitee_email},
            ],
        }
        result = service.events().insert(calendarId=google_token.calendar_id, body=event).execute()
        return result.get('id', '')
    except Exception as e:
        logger.error(f'Failed to create Google Calendar event: {e}')
        return ''


def delete_calendar_event(google_token, event_id: str):
    try:
        creds = get_credentials(google_token)
        service = build('calendar', 'v3', credentials=creds)
        service.events().delete(calendarId=google_token.calendar_id, eventId=event_id).execute()
    except Exception:
        pass
