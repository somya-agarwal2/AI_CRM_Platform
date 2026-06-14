import numpy as np
from sklearn.linear_model import LogisticRegression, LinearRegression
from datetime import datetime

# In a real system, these models would be trained offline and loaded via pickle/joblib.
# For this implementation, we will train lightweight heuristic models in-memory 
# or use parameterized formulas if there's insufficient historical data.

class PredictionEngine:
    def __init__(self):
        self.churn_model = LogisticRegression()
        self.ltv_model = LinearRegression()
        self._is_trained = False
        
    def _train_if_needed(self):
        if self._is_trained: return
        
        # Mock training data to initialize the models
        # Features for churn: [total_spent, order_count, days_since_last_purchase, engagement_score]
        X_churn = np.array([
            [500, 1, 90, 0.1],
            [1500, 3, 45, 0.5],
            [5000, 10, 5, 0.9],
            [200, 1, 120, 0.0]
        ])
        y_churn = np.array([1, 0, 0, 1]) # 1 = churned
        self.churn_model.fit(X_churn, y_churn)
        
        # Features for LTV: [current_spend, order_count, tenure_days]
        X_ltv = np.array([
            [500, 1, 30],
            [1500, 3, 180],
            [5000, 10, 365]
        ])
        y_ltv = np.array([600, 2500, 8000]) # Future LTV
        self.ltv_model.fit(X_ltv, y_ltv)
        
        self._is_trained = True

    def predict_churn(self, total_spent, order_count, last_purchase_date):
        self._train_if_needed()
        
        days_since = 0
        if last_purchase_date:
            days_since = (datetime.utcnow() - last_purchase_date).days
            
        engagement_score = min(1.0, order_count / 5.0) # Heuristic
        
        X = np.array([[total_spent or 0, order_count or 0, days_since, engagement_score]])
        prob = self.churn_model.predict_proba(X)[0][1]
        
        # Fallback to simple heuristics if model is too conservative on this dataset
        if days_since > 60 and order_count <= 2:
            prob = max(prob, 0.75)
        elif days_since < 30 and order_count > 3:
            prob = min(prob, 0.20)
            
        return round(prob * 100, 1)

    def predict_future_ltv(self, total_spent, order_count, created_at):
        self._train_if_needed()
        
        tenure = 30
        if created_at:
            tenure = (datetime.utcnow() - created_at).days
            
        X = np.array([[total_spent or 0, order_count or 0, tenure]])
        pred_ltv = self.ltv_model.predict(X)[0]
        
        # Ensure it's not predicting lower than current spend
        return round(max(pred_ltv, (total_spent or 0) * 1.1), 2)
        
    def predict_campaign_performance(self, channel, audience_size, historical_ctr=0.15):
        # A simple parameterized model since we don't have enough rows for a real ML model yet
        base_conversion = 0.05
        channel_multipliers = {
            'WhatsApp': 1.8,
            'Email': 1.0,
            'SMS': 1.2,
            'Push': 0.8
        }
        
        multiplier = channel_multipliers.get(channel, 1.0)
        expected_ctr = historical_ctr * multiplier
        expected_conv = base_conversion * multiplier
        
        # Cap limits
        expected_ctr = min(0.35, expected_ctr)
        expected_conv = min(0.15, expected_conv)
        
        return {
            "expected_ctr": round(expected_ctr * 100, 1),
            "expected_conversion": round(expected_conv * 100, 1)
        }

prediction_engine = PredictionEngine()
