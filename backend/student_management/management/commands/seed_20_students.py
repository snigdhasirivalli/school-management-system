import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User
from student_management.models import SchoolClass, Section, Student
from fees.models import Fee

class Command(BaseCommand):
    help = 'Seeds 20 unique students per section for all classes'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting student seeding process...')

        first_names = [
            "Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Krishna", "Ishaan", "Shaurya", "Pranav", "Aryan",
            "Ananya", "Diya", "Ira", "Sana", "Riya", "Aanya", "Prisha", "Siya", "Kavya", "Myra",
            "Kabir", "Rohan", "Dev", "Rahul", "Neha", "Pooja", "Aarohi", "Meera", "Yash", "Karan"
        ]
        last_names = [
            "Sharma", "Verma", "Gupta", "Kumar", "Singh", "Patel", "Reddy", "Nair", "Joshi", "Rao",
            "Mehra", "Sen", "Das", "Roy", "Choudhury", "Mishra", "Pandey", "Iyer", "Pillai", "Bose"
        ]

        try:
            with transaction.atomic():
                # 1. Clear existing student profiles and student users
                self.stdout.write('Clearing existing students and associated user accounts...')
                Student.objects.all().delete()
                # Deleting student users will also delete their profiles if not already deleted, but let's be explicit
                User.objects.filter(role='student').delete()

                # Get all classes and sections
                classes = SchoolClass.objects.all()
                sections = Section.objects.all()

                if not classes.exists():
                    self.stdout.write(self.style.ERROR('No classes found in the database. Please run seed_school_data first.'))
                    return

                student_count = 0
                for school_class in classes:
                    class_sections = sections.filter(school_class=school_class)
                    if not class_sections.exists():
                        self.stdout.write(self.style.WARNING(f'Class {school_class.name} has no sections, skipping.'))
                        continue

                    self.stdout.write(f'Seeding students for {school_class.name}...')
                    for section in class_sections:
                        for i in range(1, 21):
                            # Generate unique credentials and info
                            # To guarantee absolute uniqueness, we append class id, section id, and student index
                            first_name = first_names[(i + school_class.id + section.id) % len(first_names)]
                            last_name = last_names[(i * 3 + school_class.id + section.id) % len(last_names)]
                            full_name = f"{first_name} {last_name}"
                            
                            class_slug = school_class.name.lower().replace(" ", "_")
                            sec_slug = section.name.lower()
                            
                            username = f"stud_{class_slug}_{sec_slug}_{i}"
                            email = f"student_{class_slug}_{sec_slug}_{i}@school.com"
                            
                            # Build unique phone numbers (10 digits)
                            # Format: 9 + 2-digit class ID + 2-digit section ID + 3-digit student index + padded 0s
                            phone = f"9{school_class.id % 100:02d}{section.id % 100:02d}{i:03d}00"[:10]
                            parent_phone = f"8{school_class.id % 100:02d}{section.id % 100:02d}{i:03d}00"[:10]
                            
                            # Ensure unique admission numbers
                            admission_number = f"ADM{school_class.id:02d}{section.id:02d}{i:02d}"

                            # Create User account
                            user = User.objects.create_user(
                                username=username,
                                email=email,
                                phone=phone,
                                role='student',
                                is_verified=True,
                                is_active=True
                            )
                            user.set_password('password123')
                            user.save()

                            # Date of birth between 5 and 18 years ago based on class id
                            base_year = 2026 - (5 + (school_class.id % 12))
                            dob = datetime.date(base_year, (i % 12) + 1, (i % 28) + 1)

                            gender = 'male' if i % 2 == 0 else 'female'
                            parent_name = f"{last_name}'s Parent"
                            address = f"House No. {i}, Street {school_class.id}, Block {section.name}, Sector {school_class.id * 2}, City"

                            # Create Student profile
                            student = Student.objects.create(
                                user=user,
                                admission_number=admission_number,
                                date_of_birth=dob,
                                gender=gender,
                                parent_name=parent_name,
                                parent_phone=parent_phone,
                                address=address,
                                school_class=school_class,
                                section=section
                            )

                            # Determine fee values
                            total_amount = 6000.00
                            # Distribute fee statuses among students: paid, partial, pending
                            if i % 3 == 0:
                                paid_amount = total_amount
                                status_choice = 'paid'
                            elif i % 3 == 1:
                                paid_amount = 2000.00
                                status_choice = 'partial'
                            else:
                                paid_amount = 0.00
                                status_choice = 'pending'

                            remaining_amount = total_amount - paid_amount

                            # Create Fee entry
                            Fee.objects.create(
                                student=student,
                                total_amount=total_amount,
                                paid_amount=paid_amount,
                                remaining_amount=remaining_amount,
                                payment_date=datetime.date.today(),
                                status=status_choice
                            )

                            student_count += 1

                self.stdout.write(self.style.SUCCESS(f'Successfully seeded {student_count} unique students across all classes and sections!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'An error occurred: {str(e)}'))
            raise e
