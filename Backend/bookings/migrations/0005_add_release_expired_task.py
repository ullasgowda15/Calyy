from django.db import migrations


def create_periodic_task(apps, schema_editor):
    CrontabSchedule = apps.get_model('django_celery_beat', 'CrontabSchedule')
    PeriodicTask = apps.get_model('django_celery_beat', 'PeriodicTask')
    schedule, _ = CrontabSchedule.objects.get_or_create(
        minute='*/1', hour='*', day_of_week='*', day_of_month='*', month_of_year='*',
    )
    PeriodicTask.objects.get_or_create(
        name='Release expired pending bookings',
        defaults={
            'task': 'bookings.tasks.release_expired_pending_bookings',
            'crontab': schedule,
            'enabled': True,
        },
    )


def remove_periodic_task(apps, schema_editor):
    PeriodicTask = apps.get_model('django_celery_beat', 'PeriodicTask')
    PeriodicTask.objects.filter(name='Release expired pending bookings').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0004_currency_inr_and_pending_until'),
        ('django_celery_beat', '0018_improve_crontab_helptext'),
    ]

    operations = [
        migrations.RunPython(create_periodic_task, remove_periodic_task),
    ]
