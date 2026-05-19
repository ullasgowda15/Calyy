import pytest
from django.urls import reverse


class TestRegistration:

    def test_register_success(self, anon_client, db):
        res = anon_client.post('/api/auth/register/', {
            'email': 'newuser@test.com',
            'username': 'newuser',
            'password': 'StrongPass123!',
            'timezone': 'UTC',
        })
        assert res.status_code == 201
        assert res.data['email'] == 'newuser@test.com'
        assert res.data['username'] == 'newuser'
        assert 'password' not in res.data

    def test_register_duplicate_email(self, anon_client, host_user):
        res = anon_client.post('/api/auth/register/', {
            'email': 'host@test.com',
            'username': 'different_username',
            'password': 'StrongPass123!',
        })
        assert res.status_code == 400

    def test_register_duplicate_username(self, anon_client, host_user):
        res = anon_client.post('/api/auth/register/', {
            'email': 'different@test.com',
            'username': 'testhost',
            'password': 'StrongPass123!',
        })
        assert res.status_code == 400

    def test_register_weak_password(self, anon_client, db):
        res = anon_client.post('/api/auth/register/', {
            'email': 'weak@test.com',
            'username': 'weakuser',
            'password': '123',
        })
        assert res.status_code == 400

    def test_register_missing_email(self, anon_client, db):
        res = anon_client.post('/api/auth/register/', {
            'username': 'nouser',
            'password': 'StrongPass123!',
        })
        assert res.status_code == 400


class TestLogin:

    def test_login_success(self, anon_client, host_user):
        res = anon_client.post('/api/auth/login/', {
            'email': 'host@test.com',
            'password': 'testpass123',
        })
        assert res.status_code == 200
        assert 'access' in res.data
        assert 'refresh' in res.data

    def test_login_wrong_password(self, anon_client, host_user):
        res = anon_client.post('/api/auth/login/', {
            'email': 'host@test.com',
            'password': 'wrongpassword',
        })
        assert res.status_code == 401

    def test_login_nonexistent_user(self, anon_client, db):
        res = anon_client.post('/api/auth/login/', {
            'email': 'nobody@test.com',
            'password': 'anything',
        })
        assert res.status_code == 401


class TestProfile:

    def test_get_profile_authenticated(self, auth_client, host_user):
        res = auth_client.get('/api/auth/me/')
        assert res.status_code == 200
        assert res.data['email'] == 'host@test.com'
        assert res.data['username'] == 'testhost'

    def test_get_profile_unauthenticated(self, anon_client):
        res = anon_client.get('/api/auth/me/')
        assert res.status_code == 401

    def test_update_profile(self, auth_client, host_user):
        res = auth_client.patch('/api/auth/me/', {
            'first_name': 'Test',
            'last_name': 'User',
            'timezone': 'America/New_York',
        })
        assert res.status_code == 200
        assert res.data['first_name'] == 'Test'
        assert res.data['timezone'] == 'America/New_York'

    def test_email_is_readonly(self, auth_client, host_user):
        res = auth_client.patch('/api/auth/me/', {
            'email': 'newemail@test.com',
        })
        assert res.status_code == 200
        assert res.data['email'] == 'host@test.com'

    def test_public_profile(self, anon_client, host_user):
        res = anon_client.get('/api/auth/users/testhost/')
        assert res.status_code == 200
        assert res.data['username'] == 'testhost'

    def test_public_profile_not_found(self, anon_client, db):
        res = anon_client.get('/api/auth/users/doesnotexist/')
        assert res.status_code == 404


class TestTokenRefresh:

    def test_token_refresh(self, anon_client, host_user):
        login_res = anon_client.post('/api/auth/login/', {
            'email': 'host@test.com',
            'password': 'testpass123',
        })
        refresh_token = login_res.data['refresh']
        res = anon_client.post('/api/auth/token/refresh/', {
            'refresh': refresh_token,
        })
        assert res.status_code == 200
        assert 'access' in res.data

    def test_invalid_refresh_token(self, anon_client, db):
        res = anon_client.post('/api/auth/token/refresh/', {
            'refresh': 'invalidtoken',
        })
        assert res.status_code == 401


class TestPasswordReset:

    def test_password_reset_request_known_email(self, anon_client, host_user):
        res = anon_client.post('/api/auth/password-reset/', {
            'email': 'host@test.com',
        })
        assert res.status_code == 200

    def test_password_reset_request_unknown_email(self, anon_client, db):
        res = anon_client.post('/api/auth/password-reset/', {
            'email': 'nobody@test.com',
        })
        assert res.status_code == 200
