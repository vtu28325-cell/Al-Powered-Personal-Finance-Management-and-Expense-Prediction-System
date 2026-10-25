import random
from datetime import date, timedelta
from typing import List
from sqlalchemy.orm import Session
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.user import User


def seed_demo_data(db: Session, user: User, clear_existing: bool = True) -> int:
    """
    Populates realistic 12-month financial history for demonstration and ML testing.
    Generates diverse income and expense transactions with realistic seasonality.
    """
    if clear_existing:
        db.query(Transaction).filter(Transaction.user_id == user.id).delete()
        db.query(Budget).filter(Budget.user_id == user.id).delete()
        db.commit()

    today = date.today()
    random.seed(42)  # Deterministic seed for reproducible evaluation metrics

    transactions: List[Transaction] = []

    # 12 months of historical data
    for months_ago in range(11, -1, -1):
        # Approximate first of that month
        # Calculate year and month
        y = today.year
        m = today.month - months_ago
        while m <= 0:
            m += 12
            y -= 1

        # 1. Monthly Primary Income: Salary (paid on the 1st of each month)
        base_salary = 4800.0 + random.choice([0, 100, 200])
        transactions.append(
            Transaction(
                user_id=user.id,
                type="income",
                amount=base_salary,
                category="Salary",
                description="Monthly Software Engineer Salary",
                transaction_date=date(y, m, 1),
                payment_method="Net Banking",
            )
        )

        # 2. Side income: Freelancing / Dividend (mid month)
        if random.random() > 0.3:
            transactions.append(
                Transaction(
                    user_id=user.id,
                    type="income",
                    amount=round(random.uniform(400.0, 950.0), 2),
                    category="Freelancing",
                    description="Consulting & Code Review Project",
                    transaction_date=date(y, m, 15),
                    payment_method="UPI",
                )
            )

        # 3. Fixed Monthly Expenses: Rent & Utilities
        transactions.append(
            Transaction(
                user_id=user.id,
                type="expense",
                amount=1450.0,
                category="Rent",
                description="Apartment Monthly Lease Payment",
                transaction_date=date(y, m, 2),
                payment_method="Net Banking",
            )
        )

        transactions.append(
            Transaction(
                user_id=user.id,
                type="expense",
                amount=round(random.uniform(160.0, 220.0), 2),
                category="Utilities",
                description="Electricity & High-speed Fiber Internet",
                transaction_date=date(y, m, 5),
                payment_method="Credit Card",
            )
        )

        # 4. Weekly Food & Groceries (3-5 transactions per month)
        food_descriptions = [
            ("Weekly Supermarket Grocery Run", 110.0, 175.0, "Debit Card"),
            ("Organic Farmers Market & Pantry", 65.0, 120.0, "UPI"),
            ("Weekend Bistro Dinner with Friends", 45.0, 95.0, "Credit Card"),
            ("Specialty Coffee & Breakfast Treats", 18.0, 35.0, "UPI"),
            ("Healthy Meal Prep Supplies", 70.0, 130.0, "Credit Card"),
        ]
        for idx, (desc_text, low, high, pmethod) in enumerate(food_descriptions):
            day = min(28, 4 + idx * 5 + random.randint(0, 2))
            transactions.append(
                Transaction(
                    user_id=user.id,
                    type="expense",
                    amount=round(random.uniform(low, high), 2),
                    category="Food",
                    description=desc_text,
                    transaction_date=date(y, m, day),
                    payment_method=pmethod,
                )
            )

        # 5. Transportation
        transactions.append(
            Transaction(
                user_id=user.id,
                type="expense",
                amount=round(random.uniform(70.0, 130.0), 2),
                category="Transportation",
                description="Metro Pass & Rideshare Trips",
                transaction_date=date(y, m, 8),
                payment_method="Credit Card",
            )
        )

        # 6. Education / Learning
        if random.random() > 0.4:
            transactions.append(
                Transaction(
                    user_id=user.id,
                    type="expense",
                    amount=round(random.uniform(35.0, 85.0), 2),
                    category="Education",
                    description="Online Tech Courses & Book Subscriptions",
                    transaction_date=date(y, m, 12),
                    payment_method="Credit Card",
                )
            )

        # 7. Entertainment & Subscriptions
        transactions.append(
            Transaction(
                user_id=user.id,
                type="expense",
                amount=round(random.uniform(45.0, 110.0), 2),
                category="Entertainment",
                description="Streaming Services & Cinema Tickets",
                transaction_date=date(y, m, 18),
                payment_method="Credit Card",
            )
        )

        # 8. Shopping & Personal Care
        if random.random() > 0.35:
            transactions.append(
                Transaction(
                    user_id=user.id,
                    type="expense",
                    amount=round(random.uniform(80.0, 240.0), 2),
                    category="Shopping",
                    description="Apparel & Home Essentials",
                    transaction_date=date(y, m, 22),
                    payment_method="Credit Card",
                )
            )

        transactions.append(
            Transaction(
                user_id=user.id,
                type="expense",
                amount=round(random.uniform(30.0, 75.0), 2),
                category="Personal Care",
                description="Pharmacy, Grooming & Wellness",
                transaction_date=date(y, m, 25),
                payment_method="UPI",
            )
        )

    db.add_all(transactions)

    # Seed Budgets for current month
    default_budgets = [
        ("OVERALL", 3500.0),
        ("Food", 650.0),
        ("Rent", 1500.0),
        ("Transportation", 180.0),
        ("Utilities", 250.0),
        ("Entertainment", 150.0),
        ("Shopping", 300.0),
        ("Education", 100.0),
    ]

    for cat, amt in default_budgets:
        b = Budget(
            user_id=user.id,
            category=cat,
            amount=amt,
            month=today.month,
            year=today.year,
        )
        db.add(b)

    db.commit()
    return len(transactions)
