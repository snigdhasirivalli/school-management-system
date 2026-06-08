#!/bin/sh

# Exit immediately if a command exits with a non-zero status
set -e

# Run database migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Run auto-seeding if database is empty
echo "Checking and seeding database if empty..."
python manage.py shell -c "
from django.core.management import call_command
from accounts.models import User
if User.objects.filter(role='teacher').count() == 0:
    print('Database is empty, seeding default school data...')
    call_command('seed_school_data')
    call_command('seed_60_teachers')
    call_command('seed_20_students')
    call_command('initialize_credentials')
    call_command('seed_student_attendance')
    call_command('seed_student_marks')
    call_command('seed_timetable')
    print('Seeding completed successfully!')
else:
    print('Database already contains data, skipping seeding.')
"

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start the Gunicorn server
echo "Starting Gunicorn server..."
exec "$@"
