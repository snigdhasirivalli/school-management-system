import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from accounts.models import User
from student_management.models import SchoolClass, Section, Subject, Teacher, Student
from fees.models import Fee
from notifications.models import Notification


class Command(BaseCommand):
    help = 'Seeds the database with default school management data.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')
        
        try:
            with transaction.atomic():
                # 1. Create Default Admin User
                admin_email = 'snigdha@test.com'
                if not User.objects.filter(email=admin_email).exists():
                    admin_user = User.objects.create_superuser(
                        username='snigdha',
                        email=admin_email,
                        phone='1234567890',
                        role='admin',
                        is_verified=True,
                        is_active=True
                    )
                    admin_user.set_password('password123')
                    admin_user.save()
                    self.stdout.write(self.style.SUCCESS(f'Created Admin: {admin_email} / password123'))
                else:
                    self.stdout.write('Admin user already exists.')

                # 2. Create Classes
                class_names = ['LKG', 'UKG'] + [f'Class {i}' for i in range(1, 11)]
                classes_dict = {}
                for name in class_names:
                    school_class, created = SchoolClass.objects.get_or_create(name=name)
                    classes_dict[name] = school_class
                self.stdout.write(self.style.SUCCESS(f'Created {len(class_names)} classes.'))

                # 3. Create Sections A-E for each class
                section_names = ['A', 'B', 'C', 'D', 'E']
                sections_dict = {}
                for school_class in classes_dict.values():
                    sections_dict[school_class.name] = {}
                    for sec_name in section_names:
                        section, created = Section.objects.get_or_create(
                            school_class=school_class,
                            name=sec_name
                        )
                        sections_dict[school_class.name][sec_name] = section
                self.stdout.write(self.style.SUCCESS('Created sections A-E for all classes.'))

                # 4. Create Subjects
                subject_names = ['Mathematics', 'Science', 'English', 'Social Studies', 'History']
                subjects_dict = {}
                for sub_name in subject_names:
                    subject, created = Subject.objects.get_or_create(name=sub_name)
                    subjects_dict[sub_name] = subject
                self.stdout.write(self.style.SUCCESS(f'Created {len(subject_names)} subjects.'))

                # 5. Create Default Teachers
                teachers_data = [
                    {
                        'email': 'teacher1@school.com',
                        'username': 'teacher1',
                        'phone': '1111111111',
                        'employee_id': 'TCH001',
                        'subs': ['Mathematics', 'Science'],
                        'cls': ['Class 1', 'Class 2'],
                        'secs': ['A', 'B']
                    },
                    {
                        'email': 'teacher2@school.com',
                        'username': 'teacher2',
                        'phone': '2222222222',
                        'employee_id': 'TCH002',
                        'subs': ['English', 'History', 'Social Studies'],
                        'cls': ['Class 3', 'Class 4'],
                        'secs': ['A', 'C']
                    }
                ]
                
                for t_data in teachers_data:
                    if not User.objects.filter(email=t_data['email']).exists():
                        t_user = User.objects.create_user(
                            username=t_data['username'],
                            email=t_data['email'],
                            phone=t_data['phone'],
                            role='teacher',
                            is_verified=True,
                            is_active=True
                        )
                        t_user.set_password('password123')
                        t_user.save()

                        teacher = Teacher.objects.create(
                            user=t_user,
                            employee_id=t_data['employee_id']
                        )
                        # Assign subjects
                        for sub_name in t_data['subs']:
                            teacher.subjects.add(subjects_dict[sub_name])
                        # Assign classes and sections
                        for cls_name in t_data['cls']:
                            teacher.classes.add(classes_dict[cls_name])
                            for s_char in t_data['secs']:
                                teacher.sections.add(sections_dict[cls_name][s_char])
                        teacher.save()
                        self.stdout.write(self.style.SUCCESS(f"Created Teacher: {t_data['email']}"))

                # 6. Create Default Students
                students_data = [
                    {
                        'email': 'student1@school.com',
                        'username': 'student1',
                        'phone': '3333333333',
                        'admission_number': 'ADM2026001',
                        'dob': '2015-05-15',
                        'gender': 'male',
                        'parent_name': 'Ramesh Kumar',
                        'parent_phone': '9999999999',
                        'address': '123 Main Street, Delhi',
                        'cls': 'Class 1',
                        'sec': 'A',
                        'fee_total': 5000.00,
                        'fee_paid': 2000.00,
                        'fee_rem': 3000.00,
                        'fee_status': 'partial'
                    },
                    {
                        'email': 'student2@school.com',
                        'username': 'student2',
                        'phone': '4444444444',
                        'admission_number': 'ADM2026002',
                        'dob': '2014-08-22',
                        'gender': 'female',
                        'parent_name': 'Suresh Dev',
                        'parent_phone': '8888888888',
                        'address': '456 Ring Road, Delhi',
                        'cls': 'Class 1',
                        'sec': 'A',
                        'fee_total': 5000.00,
                        'fee_paid': 5000.00,
                        'fee_rem': 0.00,
                        'fee_status': 'paid'
                    },
                    {
                        'email': 'student3@school.com',
                        'username': 'student3',
                        'phone': '5555555555',
                        'admission_number': 'ADM2026003',
                        'dob': '2016-01-10',
                        'gender': 'male',
                        'parent_name': 'Mahesh Sharma',
                        'parent_phone': '7777777777',
                        'address': '789 Park Lane, Noida',
                        'cls': 'Class 2',
                        'sec': 'B',
                        'fee_total': 5500.00,
                        'fee_paid': 0.00,
                        'fee_rem': 5500.00,
                        'fee_status': 'pending'
                    }
                ]

                for s_data in students_data:
                    if not User.objects.filter(email=s_data['email']).exists():
                        s_user = User.objects.create_user(
                            username=s_data['username'],
                            email=s_data['email'],
                            phone=s_data['phone'],
                            role='student',
                            is_verified=True,
                            is_active=True
                        )
                        s_user.set_password('password123')
                        s_user.save()

                        student = Student.objects.create(
                            user=s_user,
                            admission_number=s_data['admission_number'],
                            date_of_birth=s_data['dob'],
                            gender=s_data['gender'],
                            parent_name=s_data['parent_name'],
                            parent_phone=s_data['parent_phone'],
                            address=s_data['address'],
                            school_class=classes_dict[s_data['cls']],
                            section=sections_dict[s_data['cls']][s_data['sec']]
                        )
                        self.stdout.write(self.style.SUCCESS(f"Created Student: {s_data['email']} in {s_data['cls']}-{s_data['sec']}"))

                        # Create Fee Ledger entry
                        Fee.objects.create(
                            student=student,
                            total_amount=s_data['fee_total'],
                            paid_amount=s_data['fee_paid'],
                            remaining_amount=s_data['fee_rem'],
                            payment_date=datetime.date.today(),
                            status=s_data['fee_status']
                        )

                # 7. Create notification
                admin_user = User.objects.get(email='snigdha@test.com')
                Notification.objects.get_or_create(
                    sender=admin_user,
                    title='Welcome to Academix Pro!',
                    message='Welcome to the new upgraded Light Mode Academix Pro School Management System. Please explore the new dashboard features.'
                )
                self.stdout.write(self.style.SUCCESS('Seeded broadcast notifications.'))

            self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error seeding database: {e}'))
