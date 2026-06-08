import random
import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User
from student_management.models import Student
from attendance.models import Attendance

class Command(BaseCommand):
    help = 'Seeds database with daily attendance logs for the last 5 days for all students.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting attendance seeding process...')

        try:
            with transaction.atomic():
                self.stdout.write('Clearing existing attendance records...')
                Attendance.objects.all().delete()

                students = list(Student.objects.all())

                if not students:
                    self.stdout.write(self.style.ERROR('No students found. Please seed students first.'))
                    return

                # Get first available teacher or admin to be the "marked_by" user
                teacher_user = User.objects.filter(role='teacher').first()
                if not teacher_user:
                    teacher_user = User.objects.filter(role='admin').first()

                if not teacher_user:
                    self.stdout.write(self.style.ERROR('No teacher or admin user found to mark attendance.'))
                    return

                self.stdout.write(f'Marking attendance for {len(students)} students by user: {teacher_user.email}...')

                # Generate dates for the last 5 weekdays (excluding Sundays)
                dates = []
                current_date = datetime.date.today()
                days_added = 0
                while days_added < 5:
                    if current_date.weekday() != 6:  # 6 is Sunday
                        dates.append(current_date)
                        days_added += 1
                    current_date -= datetime.timedelta(days=1)

                attendance_to_create = []
                for student in students:
                    for date in dates:
                        # 90% Present, 6% Late, 4% Absent
                        rand = random.random()
                        if rand < 0.90:
                            status_val = 'present'
                        elif rand < 0.96:
                            status_val = 'late'
                        else:
                            status_val = 'absent'

                        attendance_to_create.append(Attendance(
                            student=student,
                            marked_by=teacher_user,
                            date=date,
                            status=status_val
                        ))

                self.stdout.write(f'Saving {len(attendance_to_create)} attendance entries to the database...')
                Attendance.objects.bulk_create(attendance_to_create, batch_size=2000)

                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(attendance_to_create)} attendance entries!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred: {str(e)}'))
            raise e
