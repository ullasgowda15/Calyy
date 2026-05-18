from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from .models import User


class AuthTests(APITestCase):
    def setUp(self):
        self.client = APIClient(SERVER_NAME='localhost')
        self.user_data = {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'StrongPass1!',
            'timezone': 'UTC',
        }

    def test_register(self):
        resp = self.client.post('/api/auth/register/', self.user_data, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['email'], self.user_data['email'])

    def test_register_duplicate_email(self):
        self.client.post('/api/auth/register/', self.user_data, format='json')
        resp = self.client.post('/api/auth/register/', self.user_data, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_login(self):
        self.client.post('/api/auth/register/', self.user_data, format='json')
        resp = self.client.post('/api/auth/login/', {
            'email': self.user_data['email'],
            'password': self.user_data['password'],
        }, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)

    def test_login_wrong_password(self):
        self.client.post('/api/auth/register/', self.user_data, format='json')
        resp = self.client.post('/api/auth/login/', {
            'email': self.user_data['email'],
            'password': 'wrongpassword',
        }, format='json')
        self.assertEqual(resp.status_code, 401)

    def test_profile_authenticated(self):
        self.client.post('/api/auth/register/', self.user_data, format='json')
        resp = self.client.post('/api/auth/login/', self.user_data, format='json')
        token = resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = self.client.get('/api/auth/me/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['username'], self.user_data['username'])

    def test_profile_unauthenticated(self):
        resp = self.client.get('/api/auth/me/')
        self.assertEqual(resp.status_code, 401)

    def test_profile_update(self):
        self.client.post('/api/auth/register/', self.user_data, format='json')
        resp = self.client.post('/api/auth/login/', self.user_data, format='json')
        token = resp.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = self.client.patch('/api/auth/me/', {'bio': 'Updated bio'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['bio'], 'Updated bio')

    def test_public_profile(self):
        self.client.post('/api/auth/register/', self.user_data, format='json')
        resp = self.client.get(f'/api/auth/users/{self.user_data["username"]}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['username'], self.user_data['username'])

    def test_public_profile_not_found(self):
        resp = self.client.get('/api/auth/users/nonexistent/')
        self.assertEqual(resp.status_code, 404)
