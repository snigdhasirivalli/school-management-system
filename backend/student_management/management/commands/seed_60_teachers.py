import random
from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User
from student_management.models import SchoolClass, Section, Subject, Teacher

class Command(BaseCommand):
    help = 'Seeds at least 60 unique teachers and assigns them to subjects, classes, and sections.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting teacher seeding process...')

        first_names = [
            "Amit", "Rahul", "Vijay", "Sanjay", "Vikram", "Sunil", "Anil", "Rajesh", "Sandip", "Karan",
            "Priya", "Neha", "Anjali", "Pooja", "Meera", "Swati", "Ritu", "Deepa", "Shalini", "Kriti",
            "Arjun", "Aditya", "Rohan", "Siddharth", "Gaurav", "Manish", "Abhishek", "Vivek", "Alok", "Harish",
            "Kiran", "Jyoti", "Rekha", "Sita", "Gita", "Lata", "Radha", "Nisha", "Komal", "Divya",
            "Pradeep", "Suresh", "Ramesh", "Naresh", "Dinesh", "Mahesh", "Kamlesh", "Rajoc", "Sunita", "Anita",
            "Preeti", "Mamta", "Suman", "Kusum", "Pushpa", "Champa", "Chameli", "Bela", "Juhi", "Mogra"
        ]
        last_names = [
            "Sharma", "Verma", "Gupta", "Kumar", "Singh", "Patel", "Reddy", "Nair", "Joshi", "Rao",
            "Mehra", "Sen", "Das", "Roy", "Choudhury", "Mishra", "Pandey", "Iyer", "Pillai", "Bose",
            "Trivedi", "Dwivedi", "Chaturvedi", "Pathak", "Tripathi", "Dubey", "Shukla", "Mishra", "Bajpai", "Dixit"
        ]

        try:
            with transaction.atomic():
                self.stdout.write('Clearing existing teachers...')
                Teacher.objects.all().delete()
                User.objects.filter(role='teacher').delete()

                subjects = list(Subject.objects.all())
                classes = list(SchoolClass.objects.all())
                sections = list(Section.objects.all())

                if not subjects:
                    self.stdout.write(self.style.ERROR('No subjects found. Please seed base school data first.'))
                    return
                if not classes:
                    self.stdout.write(self.style.ERROR('No classes found. Please seed base school data first.'))
                    return

                teacher_count = 0
                for i in range(1, 65): # Seeds 64 teachers (at least 60)
                    first_name = first_names[(i - 1) % len(first_names)]
                    last_name = last_names[(i * 7) % len(last_names)]
                    username = f"teacher_{i}"
                    email = f"teacher_{i}@school.com"
                    employee_id = f"TCH{i:03d}"
                    phone = f"77{i:08d}"[:10] # Guaranteed unique 10-digit number

                    # Create user account
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        phone=phone,
                        role='teacher',
                        is_verified=True,
                        is_active=True
                    )
                    user.set_password('password123')
                    user.save()

                    # Create teacher profile
                    teacher = Teacher.objects.create(
                        user=user,
                        employee_id=employee_id
                    )

                    # Assign 1 to 2 random subjects
                    num_subs = (i % 2) + 1
                    for j in range(num_subs):
                        sub = subjects[(i + j) % len(subjects)]
                        teacher.subjects.add(sub)

                    # Assign 2 to 3 random classes
                    num_classes = (i % 2) + 2
                    assigned_classes = []
                    for j in range(num_classes):
                        cls = classes[(i + j) % len(classes)]
                        teacher.classes.add(cls)
                        assigned_classes.append(cls)

                    # Assign sections of those classes
                    for cls in assigned_classes:
                        class_sections = [s for s in sections if s.school_class == cls]
                        if class_sections:
                            # Assign 1 or 2 sections from this class
                            sec_count = (i % len(class_sections)) + 1
                            for k in range(min(sec_count, len(class_sections))):
                                teacher.sections.add(class_sections[k])

                    teacher.save()
                    teacher_count += 1

                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {teacher_count} unique teachers!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred: {str(e)}'))
            raise e
