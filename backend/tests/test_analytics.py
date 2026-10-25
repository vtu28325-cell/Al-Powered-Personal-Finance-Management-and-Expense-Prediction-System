from datetime import date


def test_dashboard_summary_calculations(client, auth_headers_a):
    today = date.today()

    # Add Income: $5,000
    client.post(
        "/api/v1/transactions",
        json={
            "type": "income",
            "amount": 5000.0,
            "category": "Salary",
            "description": "Monthly paycheck",
            "transaction_date": today.isoformat(),
        },
        headers=auth_headers_a,
    )

    # Add Expenses: $2,000 and $1,000
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": 2000.0,
            "category": "Rent",
            "description": "Apartment lease",
            "transaction_date": today.isoformat(),
        },
        headers=auth_headers_a,
    )
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": 1000.0,
            "category": "Food",
            "description": "Groceries",
            "transaction_date": today.isoformat(),
        },
        headers=auth_headers_a,
    )

    # Request dashboard
    response = client.get("/api/v1/analytics/dashboard", headers=auth_headers_a)
    assert response.status_code == 200
    data = response.json()

    assert data["total_income"] == 5000.0
    assert data["total_expenses"] == 3000.0
    assert data["net_balance"] == 2000.0
    assert data["savings_rate"] == 40.0  # (2000 / 5000) * 100

    # Verify category breakdown
    assert len(data["category_breakdown"]) == 2
    cats = {c["category"]: c["amount"] for c in data["category_breakdown"]}
    assert cats["Rent"] == 2000.0
    assert cats["Food"] == 1000.0


def test_financial_insights_rule_engine(client, auth_headers_a):
    # Seed demo dataset
    client.post("/api/v1/auth/seed-demo", headers=auth_headers_a)

    today = date.today()
    response = client.get(
        f"/api/v1/insights?month={today.month}&year={today.year}",
        headers=auth_headers_a,
    )
    assert response.status_code == 200
    data = response.json()

    assert data["top_spending_category"] is not None
    assert data["top_category_amount"] > 0
    assert data["savings_rating"] in ["Excellent", "Good", "Moderate", "Low", "Critical"]
    assert len(data["insights"]) > 0
    assert len(data["recommendations"]) > 0
