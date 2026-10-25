def test_prediction_with_zero_data(client, auth_headers_a):
    response = client.get("/api/v1/predictions", headers=auth_headers_a)
    assert response.status_code == 200
    data = response.json()
    assert data["predicted_total_expense"] == 0.0
    assert data["is_preliminary"] is True
    assert "No expense transactions found" in data["data_quality_notice"]


def test_prediction_with_insufficient_data(client, auth_headers_a):
    # Add just 1 month of transactions
    client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": 300.0,
            "category": "Food",
            "description": "Single month expense",
            "transaction_date": "2026-05-10",
        },
        headers=auth_headers_a,
    )
    response = client.get("/api/v1/predictions", headers=auth_headers_a)
    assert response.status_code == 200
    data = response.json()
    assert data["is_preliminary"] is True
    assert data["training_months_count"] == 1
    assert data["predicted_total_expense"] > 0


def test_prediction_with_12_months_demo_dataset(client, auth_headers_a):
    # Seed 12 months realistic dataset
    seed_res = client.post("/api/v1/auth/seed-demo", headers=auth_headers_a)
    assert seed_res.status_code == 200

    # Fetch Scikit-learn prediction
    response = client.get("/api/v1/predictions", headers=auth_headers_a)
    assert response.status_code == 200
    data = response.json()

    # Verify model trained on complete series
    assert data["is_preliminary"] is False
    assert data["training_months_count"] >= 10
    assert "Ridge" in data["model_name"]
    assert data["predicted_total_expense"] > 0
    assert data["lower_bound"] <= data["predicted_total_expense"] <= data["upper_bound"]

    # Verify baseline comparison exists
    assert data["baseline_predicted_amount"] > 0
    assert "Moving Average" in data["baseline_model_name"]

    # Verify chronological evaluation metrics
    assert data["mae"] is not None
    assert data["rmse"] is not None
    assert data["mae"] >= 0
    assert data["rmse"] >= 0

    # Verify category predictions
    assert len(data["category_predictions"]) > 0
    cat_names = [c["category"] for c in data["category_predictions"]]
    assert "Food" in cat_names or "Rent" in cat_names

    # Verify history logging
    hist_res = client.get("/api/v1/predictions/history", headers=auth_headers_a)
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert len(hist) >= 1
    assert hist[0]["predicted_amount"] == data["predicted_total_expense"]
