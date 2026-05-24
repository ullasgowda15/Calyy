#!/bin/sh
set -e

python manage.py migrate --noinput

if [ $# -eq 0 ]; then
    exec gunicorn core.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2
else
    exec "$@"
fi
