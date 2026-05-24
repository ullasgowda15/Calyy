#!/bin/sh
set -e

python manage.py migrate --noinput

if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
  python manage.py shell -c "
import os
from django.contrib.auth import get_user_model
User = get_user_model()
email = os.environ['DJANGO_SUPERUSER_EMAIL']
if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(
        email=email,
        username=os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin'),
        password=os.environ['DJANGO_SUPERUSER_PASSWORD']
    )
    print(f'Superuser {email} created')
else:
    print(f'Superuser {email} already exists')
"
fi

case "${SERVICE_TYPE:-web}" in
  web)
    exec gunicorn core.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2
    ;;
  worker)
    exec celery -A core worker --pool=solo -l info
    ;;
  beat)
    exec celery -A core beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    ;;
  *)
    exec "$@"
    ;;
esac
