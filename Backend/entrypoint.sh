#!/bin/sh
set -e

python manage.py migrate --noinput

if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
  python manage.py createsuperuser --noinput --username "${DJANGO_SUPERUSER_USERNAME:-admin}" --email "$DJANGO_SUPERUSER_EMAIL" 2>/dev/null || true
  echo "Admin user created (or already exists)"
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
