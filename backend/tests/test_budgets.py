from datetime import date


def test_budget_creation_and_status(client, auth_headers_a):
    today = date.today()

    # Set budget for Food: $200
    res_b = client.post(
        "/api/v1/budgets",
        json={
            "category": "Food",
            "amount": 200.0,
            "month": today.month,
            "year": today.year,
        },
        headers=auth_headers_a,
    )
    assert res_b.status_code == 201

    # Add transaction for Food: $170 (85% - should be 'warning')
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": 170.0,
            "category": "Food",
            "description": "Weekly supplies",
            "transaction_date": today.isoformat(),
        },
        headers=auth_headers_a,
    )

    # Fetch budget summary
    summary_res = client.get(
        f"/api/v1/budgets/summary?month={today.month}&year={today.year}",
        headers=auth_headers_a,
    )
    assert summary_res.status_code == 200
    data = summary_res.json()
    assert len(data["category_budgets"]) == 1
    food_budget = data["category_budgets"][0]
    assert food_budget["category"] == "Food"
    assert food_budget["spent"] == 170.0
    assert food_budget["remaining"] == 30.0
    assert food_budget["percentage_used"] == 85.0
    assert food_budget["status"] == "warning"


def test_budget_exceeded_status(client, auth_headers_a):
    today = date.today()

    # Set overall budget: $500
    client.post(
        "/api/v1/budgets",
        json={
            "category": "OVERALL",
            "amount": 500.0,
            "month": today.month,
            "year": today.year,
        },
        headers=auth_headers_a,
    )

    # Add expense: $550 (110% - should be 'exceeded')
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": 550.0,
            "category": "Shopping",
            "description": "New Laptop Monitor",
            "transaction_date": today.isoformat(),
        },
        headers=auth_headers_a,
    )

    summary_res = client.get(
        f"/api/v1/budgets/summary?month={today.month}&year={today.year}",
        headers=auth_headers_a,
    )
    assert summary_res.status_code == 200
    overall = summary_res.json()["overall_budget"]
    assert overall is not None
    assert overall["spent"] == 550.0
    assert overall["status"] == "exceeded"
    assert overall["remaining"] == -50.0

    # Verify active alerts endpoint returns the alert
    alerts_res = client.get("/api/v1/budgets/alerts", headers=auth_headers_a)
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) >= 1
    assert alerts[0]["severity"] == "danger"
