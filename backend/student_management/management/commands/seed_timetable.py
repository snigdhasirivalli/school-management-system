import random
from django.core.management.base import BaseCommand
from django.db import transaction
from student_management.models import SchoolClass, Section, Teacher
from timetable.models import Timetable

class Command(BaseCommand):
    help = 'Seeds conflict-free timetable slots for all classes and sections.'

    def handle(self, *args, **options):
        self.stdout.write("Starting timetable seeding...")

        try:
            with transaction.atomic():
                self.stdout.write("Clearing existing timetable entries...")
                Timetable.objects.all().delete()

                days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                periods = [
                    ('09:00:00', '09:45:00'),
                    ('09:45:00', '10:30:00'),
                    ('10:45:00', '11:30:00'),
                    ('11:30:00', '12:15:00'),
                    ('13:00:00', '13:45:00'),
                    ('13:45:00', '14:30:00')
                ]

                classes = list(SchoolClass.objects.all())
                teachers = list(Teacher.objects.all().prefetch_related('classes', 'sections', 'subjects'))

                if not classes:
                    self.stdout.write(self.style.ERROR("No classes found. Seed school data first."))
                    return
                if not teachers:
                    self.stdout.write(self.style.ERROR("No teachers found. Seed teachers first."))
                    return

                # Collect all class-section pairs
                class_sections = []
                for cls in classes:
                    for sec in cls.sections.all():
                        class_sections.append((cls, sec))

                self.stdout.write(f"Scheduling for {len(class_sections)} class-sections using {len(teachers)} teachers...")

                timetable_entries = []

                # Greedy scheduler to ensure conflict-free periods
                for day in days:
                    for start_time, end_time in periods:
                        scheduled_class_sections = set()
                        scheduled_teachers = set()

                        # Shuffle class_sections to randomize timetable slightly
                        random.shuffle(class_sections)

                        for cls, sec in class_sections:
                            if (cls.id, sec.id) in scheduled_class_sections:
                                continue

                            # Find a matching, free teacher
                            matching_teachers = [
                                t for t in teachers
                                if t.id not in scheduled_teachers
                                and cls in t.classes.all()
                                and sec in t.sections.all()
                                and t.subjects.exists()
                            ]

                            if matching_teachers:
                                # Pick a random matching teacher
                                teacher = random.choice(matching_teachers)
                                
                                # Pick one of the teacher's subjects
                                subject = random.choice(list(teacher.subjects.all()))

                                timetable_entries.append(Timetable(
                                    school_class=cls,
                                    section=sec,
                                    subject=subject,
                                    teacher=teacher,
                                    day=day,
                                    start_time=start_time,
                                    end_time=end_time
                                ))

                                scheduled_class_sections.add((cls.id, sec.id))
                                scheduled_teachers.add(teacher.id)

                self.stdout.write(f"Created {len(timetable_entries)} slot allocations. Saving to DB...")
                Timetable.objects.bulk_create(timetable_entries, batch_size=1000)
                self.stdout.write(self.style.SUCCESS(f"Successfully seeded {len(timetable_entries)} conflict-free timetable slots!"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error seeding timetable: {e}"))
