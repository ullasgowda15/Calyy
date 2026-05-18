@echo off
echo Starting Caly local development environment...

echo Starting PostgreSQL and Redis...
docker-compose up db redis -d

echo Waiting for databases to be ready...
timeout /t 5

echo Running migrations...
python manage.py migrate

echo Starting Django server on http://localhost:8000...
start cmd /k "python manage.py runserver"

echo Starting Celery worker...
start cmd /k "celery -A core worker --loglevel=info"

echo Starting Celery Beat...
start cmd /k "celery -A core beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler"

echo.
echo All services started!
echo Django: http://localhost:8000
echo API Docs: http://localhost:8000/api/docs/
echo.
echo Starting frontend...
cd ..\Frontend\caly-frontend
start cmd /k "npm run dev"
echo Frontend: http://localhost:5173
