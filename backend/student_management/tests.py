from rest_framework import status
from rest_framework.test import APITestCase
from accounts.models import User
from .models import SchoolClass, Section, Subject, Teacher, Student
from django.db import connection

class StudentManagementAPITests(APITestCase):

    def setUp(self):
        # Create admin user for auth
        self.admin_user = User.objects.create_user(
            username='admin_test',
            email='admin_test@school.com',
            phone='1234567890',
            role='admin',
            is_verified=True,
            is_active=True
        )
        self.admin_user.set_password('admin123')
        self.admin_user.save()

        # Create basic school classes, sections, and subjects
        self.school_class1 = SchoolClass.objects.create(name="Class 1")
        self.school_class2 = SchoolClass.objects.create(name="Class 2")
        
        self.section1 = Section.objects.create(name="A", school_class=self.school_class1)
        self.section2 = Section.objects.create(name="B", school_class=self.school_class2)

        self.subject1 = Subject.objects.create(name="Mathematics")
        self.subject2 = Subject.objects.create(name="Science")

        # Create multiple teachers with relationships
        for i in range(10):
            user = User.objects.create_user(
                username=f'teacher_{i}',
                email=f'teacher_{i}@school.com',
                phone=f'100000000{i}',
                role='teacher',
                is_verified=True,
                is_active=True
            )
            teacher = Teacher.objects.create(
                user=user,
                employee_id=f'EMP00{i}'
            )
            teacher.classes.add(self.school_class1, self.school_class2)
            teacher.sections.add(self.section1, self.section2)
            teacher.subjects.add(self.subject1, self.subject2)

    def test_teachers_endpoint_query_count(self):
        """Test that fetching teachers database queries is optimized (no N+1 regressing)."""
        # Login
        login_url = '/api/login/'
        login_data = {
            'email': 'admin_test@school.com',
            'password': 'admin123'
        }
        login_res = self.client.post(login_url, login_data, format='json')
        token = login_res.data['access']

        # Query teachers with query counting
        teachers_url = '/api/students/teachers/'
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # We assert that executing GET on teachers makes a small number of queries (7)
        # instead of N+1 (which would be >30 queries for 10 teachers).
        with self.assertNumQueries(7):
            response = self.client.get(teachers_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(len(response.data), 10)

    def test_add_student_validation(self):
        """Test creating a student with invalid data triggers clean validation error formatting."""
        # Login
        login_url = '/api/login/'
        login_data = {
            'email': 'admin_test@school.com',
            'password': 'admin123'
        }
        login_res = self.client.post(login_url, login_data, format='json')
        token = login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Send invalid post data (missing required user fields and admission number)
        add_url = '/api/students/add/'
        invalid_data = {
            'gender': 'male',
            'date_of_birth': '2010-01-01'
        }
        response = self.client.post(add_url, invalid_data, format='json')
        
        # Verify 400 Bad Request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Verify clean exception handler response formatting
        self.assertIn('success', response.data)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error']['code'], 400)
        self.assertEqual(response.data['error']['message'], "Validation failed.")
        self.assertIn('admission_number', response.data['error']['details'])
