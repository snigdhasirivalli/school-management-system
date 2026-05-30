import random
from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User
from student_management.models import Student, Subject
from marks.models import Mark

class Command(BaseCommand):
    help = 'Seeds database with random exam marks (Midterm, Final, Unit Test) for all students and subjects.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting marks seeding process...')

        try:
            with transaction.atomic():
                self.stdout.write('Clearing existing exam marks...')
                Mark.objects.all().delete()

                students = list(Student.objects.all())
                subjects = list(Subject.objects.all())

                if not students:
                    self.stdout.write(self.style.ERROR('No students found. Please seed students first.'))
                    return
                if not subjects:
                    self.stdout.write(self.style.ERROR('No subjects found. Please seed subjects first.'))
                    return

                try:
                    grader = User.objects.get(email='snigdha@test.com')
                except User.DoesNotExist:
                    self.stdout.write(self.style.WARNING('Admin user snigdha@test.com not found, using first available user...'))
                    grader = User.objects.first()

                self.stdout.write(f'Generating marks for {len(students)} students across {len(subjects)} subjects...')

                marks_to_create = []
                for student in students:
                    for subject in subjects:
                        # 1. Midterm Exam (out of 100)
                        midterm_obtained = random.randint(50, 100)
                        marks_to_create.append(Mark(
                            student=student,
                            subject=subject,
                            exam_type='midterm',
                            marks_obtained=midterm_obtained,
                            total_marks=100,
                            graded_by=grader
                        ))

                        # 2. Final Exam (out of 100)
                        final_obtained = random.randint(55, 100)
                        marks_to_create.append(Mark(
                            student=student,
                            subject=subject,
                            exam_type='final',
                            marks_obtained=final_obtained,
                            total_marks=100,
                            graded_by=grader
                        ))

                        # 3. Unit Test (out of 50)
                        ut_obtained = random.randint(25, 50)
                        marks_to_create.append(Mark(
                            student=student,
                            subject=subject,
                            exam_type='unit_test',
                            marks_obtained=ut_obtained,
                            total_marks=50,
                            graded_by=grader
                        ))

                self.stdout.write(f'Saving {len(marks_to_create)} marks entries to the database...')
                Mark.objects.bulk_create(marks_to_create, batch_size=2000)

                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(marks_to_create)} marks entries!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred: {str(e)}'))
            raise e
