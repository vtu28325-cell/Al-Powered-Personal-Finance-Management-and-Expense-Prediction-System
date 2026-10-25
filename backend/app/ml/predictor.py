import calendar
from datetime import date, datetime
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge, LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from app.models.transaction import Transaction
from app.schemas.prediction import (
    PredictionResponse,
    CategoryPredictionItem,
    HistoricalComparisonPoint,
)


class ExpensePredictor:
    """
    Production-ready Time-Series Expense Predictor using Scikit-Learn.
    Designed for B.Tech CSE (AI & ML) project evaluation.
    Features:
    - Time-lagged feature engineering (lag-1, lag-2, 3-month rolling average)
    - Cyclical month seasonality (sine/cosine transforms)
    - Ridge Regression with L2 regularization to prevent overfitting on small/medium series
    - Simple Moving Average baseline comparator
    - Chronological train/test split to prevent temporal data leakage
    - Out-of-sample evaluation metrics: MAE, RMSE, and R²
    - Category-level decomposition and explainability
    """

    def __init__(self, transactions: List[Transaction]):
        self.transactions = transactions

    def _prepare_monthly_dataframe(self) -> pd.DataFrame:
        """Filter expenses and aggregate by calendar month (YYYY-MM)."""
        expense_records = [
            {
                "amount": t.amount,
                "category": t.category,
                "date": t.transaction_date,
                "year": t.transaction_date.year,
                "month": t.transaction_date.month,
                "period": f"{t.transaction_date.year}-{t.transaction_date.month:02d}",
            }
            for t in self.transactions
            if t.type == "expense"
        ]

        if not expense_records:
            return pd.DataFrame(columns=["period", "year", "month", "total_expense"])

        df = pd.DataFrame(expense_records)
        df["date"] = pd.to_datetime(df["date"])

        # Monthly total expenses
        monthly_df = (
            df.groupby(["period", "year", "month"])["amount"]
            .sum()
            .reset_index()
            .rename(columns={"amount": "total_expense"})
        )
        monthly_df = monthly_df.sort_values(by=["year", "month"]).reset_index(drop=True)
        return monthly_df

    def _prepare_category_monthly_dataframe(self) -> pd.DataFrame:
        """Aggregate monthly spending per category."""
        expense_records = [
            {
                "amount": t.amount,
                "category": t.category,
                "period": f"{t.transaction_date.year}-{t.transaction_date.month:02d}",
            }
            for t in self.transactions
            if t.type == "expense"
        ]
        if not expense_records:
            return pd.DataFrame(columns=["period", "category", "amount"])

        df = pd.DataFrame(expense_records)
        cat_df = df.groupby(["period", "category"])["amount"].sum().reset_index()
        return cat_df

    def predict_next_month(
        self, target_year: Optional[int] = None, target_month: Optional[int] = None
    ) -> PredictionResponse:
        monthly_df = self._prepare_monthly_dataframe()
        cat_df = self._prepare_category_monthly_dataframe()

        # Determine target month
        today = date.today()
        if target_year is None or target_month is None:
            if target_month is None:
                target_month = today.month + 1 if today.month < 12 else 1
                target_year = today.year if today.month < 12 else today.year + 1
        target_period = f"{target_year}-{target_month:02d}"

        # Case 1: Zero transactions
        if monthly_df.empty:
            return PredictionResponse(
                target_month=target_month,
                target_year=target_year,
                target_period=target_period,
                predicted_total_expense=0.0,
                lower_bound=0.0,
                upper_bound=0.0,
                model_name="N/A (No Historical Data)",
                baseline_model_name="Zero-Baseline",
                baseline_predicted_amount=0.0,
                training_months_count=0,
                is_preliminary=True,
                data_quality_notice="No expense transactions found. Add transactions or load demo data to train the ML model.",
                explanation="Prediction cannot be computed without historical transaction records.",
                category_predictions=[],
                history_points=[],
            )

        n_months = len(monthly_df)
        history_points = [
            HistoricalComparisonPoint(
                period=row["period"],
                actual=round(float(row["total_expense"]), 2),
                predicted=None,
            )
            for _, row in monthly_df.iterrows()
        ]

        # Case 2: Insufficient historical periods (< 3 months)
        if n_months < 3:
            avg_expense = float(monthly_df["total_expense"].mean())
            cat_breakdown = self._compute_category_breakdown_heuristic(cat_df, avg_expense)
            return PredictionResponse(
                target_month=target_month,
                target_year=target_year,
                target_period=target_period,
                predicted_total_expense=round(avg_expense, 2),
                lower_bound=round(max(0.0, avg_expense * 0.85), 2),
                upper_bound=round(avg_expense * 1.15, 2),
                model_name="Empirical Mean (Preliminary)",
                baseline_model_name="Single-Month Average",
                baseline_predicted_amount=round(avg_expense, 2),
                training_months_count=n_months,
                is_preliminary=True,
                data_quality_notice=f"Only {n_months} month(s) of transaction data recorded. Machine learning regression requires at least 3-6 continuous months to fit robust lag parameters.",
                explanation=f"Based on preliminary historical average ({n_months} recorded month(s)), your expected expense is ~${avg_expense:,.2f}. Load sample dataset to see full Scikit-learn regression evaluation.",
                category_predictions=cat_breakdown,
                history_points=history_points,
            )

        # Build feature matrix with time index, lag features, and rolling mean
        df_feat = monthly_df.copy()
        df_feat["time_idx"] = np.arange(len(df_feat))
        df_feat["sin_month"] = np.sin(2 * np.pi * df_feat["month"] / 12.0)
        df_feat["cos_month"] = np.cos(2 * np.pi * df_feat["month"] / 12.0)
        df_feat["lag_1"] = df_feat["total_expense"].shift(1)
        df_feat["lag_2"] = df_feat["total_expense"].shift(2)
        df_feat["rolling_3m"] = (
            df_feat["total_expense"].rolling(window=3, min_periods=1).mean().shift(1)
        )

        # Baseline: 3-month moving average of available recent months
        baseline_predicted = float(monthly_df["total_expense"].tail(3).mean())

        # When we have between 3 and 5 months, we use time index + available lags
        if n_months < 6:
            # Drop NaN rows from lag creation
            valid_df = df_feat.dropna().reset_index(drop=True)
            if len(valid_df) < 2:
                # Fallback to simple linear regression on time_idx
                X_train = df_feat[["time_idx"]].values
                y_train = df_feat["total_expense"].values
                model = LinearRegression()
                model.fit(X_train, y_train)

                next_time_idx = np.array([[len(df_feat)]])
                pred_val = float(model.predict(next_time_idx)[0])
                pred_val = max(0.0, pred_val)

                # Fitted points
                for i, row in enumerate(history_points):
                    fitted = float(model.predict(np.array([[i]]))[0])
                    row.predicted = round(max(0.0, fitted), 2)

                cat_preds = self._compute_category_breakdown_heuristic(cat_df, pred_val)
                return PredictionResponse(
                    target_month=target_month,
                    target_year=target_year,
                    target_period=target_period,
                    predicted_total_expense=round(pred_val, 2),
                    lower_bound=round(max(0.0, pred_val * 0.88), 2),
                    upper_bound=round(pred_val * 1.12, 2),
                    model_name="Linear Trend Regression",
                    baseline_model_name="3-Month Moving Average",
                    baseline_predicted_amount=round(baseline_predicted, 2),
                    training_months_count=n_months,
                    is_preliminary=True,
                    data_quality_notice=f"Preliminary model trained on {n_months} monthly intervals. Full chronological train/test split will activate with 6+ months of history.",
                    explanation=f"A linear trend model estimated next month's spending at ${pred_val:,.2f}, compared to a simple 3-month moving average of ${baseline_predicted:,.2f}.",
                    category_predictions=cat_preds,
                    history_points=history_points,
                )

        # Case 3: Robust Time-Series Regression (n_months >= 6)
        # Drop rows where lag features are NaN (first 2 rows)
        clean_df = df_feat.dropna().reset_index(drop=True)
        feature_cols = ["time_idx", "sin_month", "cos_month", "lag_1", "lag_2", "rolling_3m"]
        X = clean_df[feature_cols].values
        y = clean_df["total_expense"].values

        # Chronological Train/Test Split (last 2 months as test set to prevent lookahead bias)
        test_size = min(2, len(clean_df) // 3)
        train_size = len(clean_df) - test_size

        X_train, X_test = X[:train_size], X[train_size:]
        y_train, y_test = y[:train_size], y[train_size:]

        # Train Scikit-learn Ridge Regression (regularized to guard against colinearity)
        eval_model = Ridge(alpha=1.0)
        eval_model.fit(X_train, y_train)

        # Test evaluation
        test_preds = eval_model.predict(X_test)
        mae = float(mean_absolute_error(y_test, test_preds))
        rmse = float(np.sqrt(mean_squared_error(y_test, test_preds)))
        try:
            r2 = float(r2_score(y_test, test_preds))
        except Exception:
            r2 = 0.0

        # Now retrain final model on ALL available data for next month's inference
        final_model = Ridge(alpha=1.0)
        final_model.fit(X, y)

        # Predict next month features:
        latest_row = clean_df.iloc[-1]
        next_time_idx = latest_row["time_idx"] + 1
        next_sin = np.sin(2 * np.pi * target_month / 12.0)
        next_cos = np.cos(2 * np.pi * target_month / 12.0)
        next_lag1 = float(clean_df.iloc[-1]["total_expense"])
        next_lag2 = float(clean_df.iloc[-2]["total_expense"])
        next_rolling = float(clean_df["total_expense"].tail(3).mean())

        next_features = np.array(
            [[next_time_idx, next_sin, next_cos, next_lag1, next_lag2, next_rolling]]
        )
        predicted_total = float(final_model.predict(next_features)[0])
        predicted_total = max(0.0, predicted_total)

        # Calculate residual error standard deviation for confidence bounds (90% interval ~ 1.645 std)
        residuals = y - final_model.predict(X)
        res_std = float(np.std(residuals)) if len(residuals) > 1 else (predicted_total * 0.1)
        lower_bound = max(0.0, predicted_total - 1.645 * res_std)
        upper_bound = predicted_total + 1.645 * res_std

        # Attach in-sample predictions for charting
        for idx, row in clean_df.iterrows():
            orig_idx = int(row["time_idx"])
            if orig_idx < len(history_points):
                fitted_val = float(final_model.predict(np.array([X[idx]]))[0])
                history_points[orig_idx].predicted = round(max(0.0, fitted_val), 2)

        # Category level forecast
        category_predictions = self._predict_category_breakdowns(
            cat_df, target_period, predicted_total
        )

        # Explainability summary
        trend_word = "upward" if predicted_total > next_lag1 else "downward"
        diff_from_last = abs(predicted_total - next_lag1)
        explanation = (
            f"Trained Ridge Regression with L2 Regularization on {n_months} months of spending history. "
            f"The model projects an overall {trend_word} trajectory of ${diff_from_last:,.2f} relative to last month, "
            f"factoring in recent 3-month momentum (${next_rolling:,.2f}) and calendar seasonality."
        )

        return PredictionResponse(
            target_month=target_month,
            target_year=target_year,
            target_period=target_period,
            predicted_total_expense=round(predicted_total, 2),
            lower_bound=round(lower_bound, 2),
            upper_bound=round(upper_bound, 2),
            model_name="Scikit-Learn Ridge Regression (L2)",
            baseline_model_name="3-Month Moving Average",
            baseline_predicted_amount=round(baseline_predicted, 2),
            training_months_count=n_months,
            is_preliminary=False,
            data_quality_notice=None,
            mae=round(mae, 2),
            rmse=round(rmse, 2),
            r2_score=round(r2, 3),
            explanation=explanation,
            feature_importance_note="Key features: Previous month spending (lag_1), 3-month rolling mean, and monthly cyclical seasonality.",
            category_predictions=category_predictions,
            history_points=history_points,
        )

    def _compute_category_breakdown_heuristic(
        self, cat_df: pd.DataFrame, total_pred: float
    ) -> List[CategoryPredictionItem]:
        if cat_df.empty:
            return []
        cat_sums = cat_df.groupby("category")["amount"].sum().reset_index()
        overall_sum = cat_sums["amount"].sum()
        if overall_sum <= 0:
            return []

        results = []
        for _, row in cat_sums.sort_values(by="amount", ascending=False).iterrows():
            fraction = float(row["amount"]) / overall_sum
            cat_pred = round(total_pred * fraction, 2)
            results.append(
                CategoryPredictionItem(
                    category=str(row["category"]),
                    predicted_amount=cat_pred,
                    percentage_of_total=round(fraction * 100.0, 1),
                    historical_avg=round(float(row["amount"]) / max(1, len(cat_df["period"].unique())), 2),
                    trend_direction="stable",
                )
            )
        return results

    def _predict_category_breakdowns(
        self, cat_df: pd.DataFrame, target_period: str, total_predicted: float
    ) -> List[CategoryPredictionItem]:
        """Predict spending per category based on historical shares and momentum."""
        if cat_df.empty:
            return []

        unique_periods = sorted(cat_df["period"].unique())
        cat_grouped = cat_df.groupby("category")

        prelim_cat_preds: Dict[str, float] = {}
        historical_avgs: Dict[str, float] = {}
        trends: Dict[str, str] = {}

        for cat, group in cat_grouped:
            amounts = group.sort_values(by="period")["amount"].values
            hist_avg = float(np.mean(amounts))
            historical_avgs[cat] = hist_avg

            # If category has at least 3 historical points, apply linear trend or weighted average
            if len(amounts) >= 3:
                recent_avg = float(np.mean(amounts[-3:]))
                pred = (recent_avg * 0.7) + (hist_avg * 0.3)
                if amounts[-1] > hist_avg * 1.05:
                    trends[cat] = "increasing"
                elif amounts[-1] < hist_avg * 0.95:
                    trends[cat] = "decreasing"
                else:
                    trends[cat] = "stable"
            else:
                pred = hist_avg
                trends[cat] = "stable"

            prelim_cat_preds[cat] = max(0.0, pred)

        raw_sum = sum(prelim_cat_preds.values())
        if raw_sum <= 0:
            return []

        # Calibrate category predictions to match the regression model's total predicted expense
        results = []
        for cat, raw_pred in sorted(prelim_cat_preds.items(), key=lambda x: x[1], reverse=True):
            calibrated_pred = round((raw_pred / raw_sum) * total_predicted, 2)
            pct = round((calibrated_pred / total_predicted * 100.0), 1) if total_predicted > 0 else 0.0
            results.append(
                CategoryPredictionItem(
                    category=cat,
                    predicted_amount=calibrated_pred,
                    percentage_of_total=pct,
                    historical_avg=round(historical_avgs.get(cat, 0.0), 2),
                    trend_direction=trends.get(cat, "stable"),
                )
            )

        return results
