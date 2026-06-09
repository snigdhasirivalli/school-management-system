from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import User, AuditLog

class AccountsAPITests(APITestCase):

    def setUp(self):
        # Create an admin user
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

        # Create a student user
        self.student_user = User.objects.create_user(
            username='student_test',
            email='student_test@school.com',
            phone='0987654321',
            role='student',
            is_verified=True,
            is_active=True
        )
        self.student_user.set_password('student123')
        self.student_user.save()

    def test_user_login(self):
        """Test standard login and JWT token retrieval."""
        url = '/api/login/'
        data = {
            'email': 'admin_test@school.com',
            'password': 'admin123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_audit_logs_unauthorized_access(self):
        """Test that non-admins cannot retrieve audit logs (expects 403)."""
        # Login as student
        login_url = '/api/login/'
        login_data = {
            'email': 'student_test@school.com',
            'password': 'student123'
        }
        login_res = self.client.post(login_url, login_data, format='json')
        token = login_res.data['access']

        # Query audit logs
        logs_url = '/api/audit-logs/'
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(logs_url)
        
        # Verify 403 Forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # Verify standard custom exception format
        self.assertIn('success', response.data)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error']['code'], 403)
        self.assertEqual(response.data['error']['message'], "Admin permission required")

    def test_audit_logs_authorized_access(self):
        """Test that admin user can successfully retrieve audit logs."""
        # Login as admin
        login_url = '/api/login/'
        login_data = {
            'email': 'admin_test@school.com',
            'password': 'admin123'
        }
        login_res = self.client.post(login_url, login_data, format='json')
        token = login_res.data['access']

        # Query audit logs
        logs_url = '/api/audit-logs/'
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.get(logs_url)
        
        # Verify 200 OK
        self.assertEqual(response.status_code, status.HTTP_200_OK)
