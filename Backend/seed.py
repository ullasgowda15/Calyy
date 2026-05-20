import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import User
from events.models import EventType, Availability
from datetime import time

user, created = User.objects.get_or_create(
    email='host@test.com',
    defaults={
        'username': 'testhost',
        'timezone': 'America/New_York',
        'first_name': 'Test',
        'last_name': 'Host',
    }
)
if created:
    user.set_password('testpass123')
    user.save()
    print('Created test user: host@test.com / testpass123')

et1, _ = EventType.objects.get_or_create(
    host=user, slug='30-min-call',
    defaults={
        'name': '30 Minute Call',
        'duration': 30,
        'buffer_after': 10,
        'min_notice': 120,
        'max_advance_days': 30,
        'location_type': 'zoom',
        'color': '#0069FF',
    }
)

et2, _ = EventType.objects.get_or_create(
    host=user, slug='60-min-consultation',
    defaults={
        'name': '60 Minute Consultation',
        'duration': 60,
        'buffer_after': 15,
        'min_notice': 240,
        'max_advance_days': 30,
        'location_type': 'zoom',
        'price': '99.00',
        'currency': 'INR',
        'color': '#9B51E0',
    }
)

for weekday in range(5):
    Availability.objects.get_or_create(
        user=user, weekday=weekday,
        start_time=time(9, 0),
        end_time=time(17, 0),
    )

print('Seed complete. Event types and availability created.')
print(f'Booking URL: /book/testhost/30-min-call/')
