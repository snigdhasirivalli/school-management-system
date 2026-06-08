import os
import csv
from django.core.management.base import BaseCommand
from accounts.models import User

class Command(BaseCommand):
    help = 'Initialize credentials for admin, teachers, and students, and export them to reference files.'

    def handle(self, *args, **options):
        self.stdout.write("Initializing credentials...")
        
        # 1. Update/Ensure Admin User
        admin_email = 'snigdha@test.com'
        admin_username = 'snigdha'
        admin_password = 'admin123'
        
        admin_user, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                'username': admin_username,
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
                'is_verified': True
            }
        )
        admin_user.set_password(admin_password)
        # Ensure correct flags if it already existed
        admin_user.role = 'admin'
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.is_active = True
        admin_user.is_verified = True
        admin_user.save()
        
        if created:
            self.stdout.write(f"Created admin user: {admin_email}")
        else:
            self.stdout.write(f"Updated admin user: {admin_email}")
            
        # 2. Update Teachers
        teachers = User.objects.filter(role='teacher')
        teacher_count = teachers.count()
        for teacher in teachers:
            teacher.set_password('teacher123')
            teacher.is_active = True
            teacher.is_verified = True
            teacher.save()
        self.stdout.write(f"Updated passwords for {teacher_count} teachers.")

        # 3. Update Students
        students = User.objects.filter(role='student')
        student_count = students.count()
        for student in students:
            student.set_password('student123')
            student.is_active = True
            student.is_verified = True
            student.save()
        self.stdout.write(f"Updated passwords for {student_count} students.")

        # 4. Export to CSV and Markdown
        root_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
        
        csv_path = os.path.join(root_dir, 'credentials.csv')
        md_path = os.path.join(root_dir, 'credentials_summary.md')
        
        all_users = User.objects.all().order_by('role', 'username')
        
        # Write CSV
        with open(csv_path, 'w', newline='', encoding='utf-8') as csv_file:
            writer = csv.writer(csv_file)
            writer.writerow(['Username', 'Email', 'Role', 'Password'])
            
            # Write Admin
            writer.writerow([admin_username, admin_email, 'admin', admin_password])
            
            # Write Teachers and Students
            for u in all_users:
                if u.email == admin_email:
                    continue
                pwd = 'teacher123' if u.role == 'teacher' else 'student123' if u.role == 'student' else 'unknown123'
                writer.writerow([u.username, u.email, u.role, pwd])
                
        self.stdout.write(f"Exported credentials list to {csv_path}")

        # Write Markdown Summary
        # Show first 10 accounts of each role as examples
        with open(md_path, 'w', encoding='utf-8') as md_file:
            md_file.write("# School Portal Login Credentials Summary\n\n")
            md_file.write("This file summarizes the login credentials configured for testing the School Management System.\n")
            md_file.write("A complete CSV file containing all accounts is generated at [credentials.csv](./credentials.csv).\n\n")
            
            md_file.write("## Password Scheme\n\n")
            md_file.write("| Role | Default Password |\n")
            md_file.write("| --- | --- |\n")
            md_file.write(f"| **Admin** | `{admin_password}` |\n")
            md_file.write("| **Teacher** | `teacher123` |\n")
            md_file.write("| **Student** | `student123` |\n\n")
            
            # Admin list
            md_file.write("## 1. Administrator Credential\n\n")
            md_file.write(f"- **Email/Login**: `{admin_email}`\n")
            md_file.write(f"- **Username**: `{admin_username}`\n")
            md_file.write(f"- **Password**: `{admin_password}`\n\n")
            
            # Sample Teachers
            sample_teachers = all_users.filter(role='teacher')[:10]
            md_file.write(f"## 2. Teachers (Total: {teacher_count})\n\n")
            md_file.write("Below are the first 10 teacher accounts (use `teacher123` as the password for all of them):\n\n")
            md_file.write("| Username | Email / Login | Role | Password |\n")
            md_file.write("| --- | --- | --- | --- |\n")
            for t in sample_teachers:
                md_file.write(f"| {t.username} | {t.email} | teacher | `teacher123` |\n")
            md_file.write("\n")
            
            # Sample Students
            sample_students = all_users.filter(role='student')[:15]
            md_file.write(f"## 3. Students (Total: {student_count})\n\n")
            md_file.write("Below are the first 15 student accounts (use `student123` as the password for all of them):\n\n")
            md_file.write("| Username | Email / Login | Role | Password |\n")
            md_file.write("| --- | --- | --- | --- |\n")
            for s in sample_students:
                md_file.write(f"| {s.username} | {s.email} | student | `student123` |\n")
            md_file.write("\n")
            
        self.stdout.write(f"Exported credentials summary to {md_path}")
        self.stdout.write("Credentials initialization complete!")
