from django.db import migrations, models
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ('bookings', '0007_booking_reschedule_count'),
    ]

    operations = [
        migrations.CreateModel(
            name='BookingSession',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
                ('used', models.BooleanField(default=False)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
