#!/bin/sh
set -e

python manage.py migrate --noinput

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
