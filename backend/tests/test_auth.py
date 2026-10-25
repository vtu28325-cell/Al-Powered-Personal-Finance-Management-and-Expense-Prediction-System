def test_register_user_success(client):
    payload = {
        "email": "newuser@example.com",
        "full_name": "New User",
        "password": "Password123!",
        "currency": "USD",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["full_name"] == "New User"


def test_register_duplicate_email(client, test_user_a):
    payload = {
        "email": "alice@example.com",  # Already registered in fixture
        "full_name": "Another Alice",
        "password": "Password999!",
        "currency": "USD",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_json_success(client, test_user_a):
    payload = {
        "email": "alice@example.com",
        "password": "Secret123!",
    }
    response = client.post("/api/v1/auth/login/json", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "alice@example.com"


def test_login_invalid_password(client, test_user_a):
    payload = {
        "email": "alice@example.com",
        "password": "WrongPassword!",
    }
    response = client.post("/api/v1/auth/login/json", json=payload)
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_get_current_user_profile(client, auth_headers_a):
    response = client.get("/api/v1/auth/me", headers=auth_headers_a)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "alice@example.com"
    assert data["full_name"] == "Alice Researcher"


def test_get_current_user_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
