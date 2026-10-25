from datetime import date


def test_create_transaction_success(client, auth_headers_a):
    payload = {
        "type": "expense",
        "amount": 85.50,
        "category": "Food",
        "description": "Weekly grocery shopping",
        "transaction_date": "2026-05-10",
        "payment_method": "Credit Card",
    }
    response = client.post("/api/v1/transactions", json=payload, headers=auth_headers_a)
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 85.50
    assert data["category"] == "Food"
    assert data["type"] == "expense"
    assert "id" in data


def test_create_transaction_negative_amount_fails(client, auth_headers_a):
    payload = {
        "type": "expense",
        "amount": -50.0,
        "category": "Food",
        "description": "Invalid negative entry",
        "transaction_date": "2026-05-10",
    }
    response = client.post("/api/v1/transactions", json=payload, headers=auth_headers_a)
    assert response.status_code == 422  # Pydantic validation error


def test_list_and_filter_transactions(client, auth_headers_a):
    # Add an income and an expense
    client.post(
        "/api/v1/transactions",
        json={
            "type": "income",
            "amount": 3500.0,
            "category": "Salary",
            "description": "Monthly paycheck",
            "transaction_date": "2026-05-01",
        },
        headers=auth_headers_a,
    )
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": 120.0,
            "category": "Food",
            "description": "Dinner at restaurant",
            "transaction_date": "2026-05-03",
        },
        headers=auth_headers_a,
    )

    # Filter for income only
    res_income = client.get(
        "/api/v1/transactions?tx_type=income", headers=auth_headers_a
    )
    assert res_income.status_code == 200
    assert res_income.json()["total"] == 1
    assert res_income.json()["items"][0]["category"] == "Salary"

    # Filter for expense only
    res_expense = client.get(
        "/api/v1/transactions?tx_type=expense", headers=auth_headers_a
    )
    assert res_expense.status_code == 200
    assert res_expense.json()["total"] == 1
    assert res_expense.json()["items"][0]["category"] == "Food"


def test_update_and_delete_transaction(client, auth_headers_a):
    create_res = client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": 40.0,
            "category": "Transportation",
            "description": "Metro pass",
            "transaction_date": "2026-05-04",
        },
        headers=auth_headers_a,
    )
    tx_id = create_res.json()["id"]

    # Update amount
    update_res = client.put(
        f"/api/v1/transactions/{tx_id}",
        json={"amount": 45.0, "description": "Metro pass updated"},
        headers=auth_headers_a,
    )
    assert update_res.status_code == 200
    assert update_res.json()["amount"] == 45.0
    assert update_res.json()["description"] == "Metro pass updated"

    # Delete
    del_res = client.delete(f"/api/v1/transactions/{tx_id}", headers=auth_headers_a)
    assert del_res.status_code == 204

    # Verify 404 on get
    get_res = client.get(f"/api/v1/transactions/{tx_id}", headers=auth_headers_a)
    assert get_res.status_code == 404
