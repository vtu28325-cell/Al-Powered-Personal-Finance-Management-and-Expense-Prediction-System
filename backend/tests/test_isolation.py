def test_user_data_isolation(client, auth_headers_a, auth_headers_b):
    # 1. User A creates a private transaction
    res_a = client.post(
        "/api/v1/transactions",
        json={
            "type": "expense",
            "amount": 250.0,
            "category": "Education",
            "description": "User A private course purchase",
            "transaction_date": "2026-05-15",
        },
        headers=auth_headers_a,
    )
    assert res_a.status_code == 201
    tx_id_a = res_a.json()["id"]

    # 2. User B lists transactions -> must NOT see User A's transaction
    res_b_list = client.get("/api/v1/transactions", headers=auth_headers_b)
    assert res_b_list.status_code == 200
    assert res_b_list.json()["total"] == 0
    assert len(res_b_list.json()["items"]) == 0

    # 3. User B attempts to read User A's transaction directly by ID -> 404 Not Found
    res_b_read = client.get(f"/api/v1/transactions/{tx_id_a}", headers=auth_headers_b)
    assert res_b_read.status_code == 404

    # 4. User B attempts to modify User A's transaction -> 404 Not Found
    res_b_edit = client.put(
        f"/api/v1/transactions/{tx_id_a}",
        json={"amount": 999.0, "description": "Hacked description"},
        headers=auth_headers_b,
    )
    assert res_b_edit.status_code == 404

    # 5. User B attempts to delete User A's transaction -> 404 Not Found
    res_b_del = client.delete(f"/api/v1/transactions/{tx_id_a}", headers=auth_headers_b)
    assert res_b_del.status_code == 404

    # 6. Verify User A's transaction remains unchanged and intact
    res_a_verify = client.get(f"/api/v1/transactions/{tx_id_a}", headers=auth_headers_a)
    assert res_a_verify.status_code == 200
    assert res_a_verify.json()["amount"] == 250.0
    assert res_a_verify.json()["description"] == "User A private course purchase"
