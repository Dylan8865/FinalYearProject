import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor

class MLPredictionService:
    @staticmethod
    def train_and_predict(study_minutes: int, scores: list[float]) -> float:
        """
        Train a Random Forest Regressor dynamically based on the student's historical scores.
        If there is not enough data (<3 attempts), use a fallback mathematical baseline.
        """
        # Cold start fallback for small datasets
        if len(scores) < 3:
            return MLPredictionService._baseline_prediction(scores, study_minutes)

        # Build training data
        # We assume the student's score trajectory is influenced by their cumulative study time 
        # and the sequential nature of their attempts.
        X_train = []
        y_train = []

        # Synthetic feature generation based on historical attempts
        cumulative_study = 0
        for i in range(len(scores) - 1):
            # In a real scenario we'd use exact study minutes per gap.
            # Here, we distribute the total study minutes proportionally to create feature variation.
            session_effort = study_minutes / max(1, len(scores))
            cumulative_study += session_effort
            
            # Features: [Previous Score, Cumulative Study Effort, Attempt Number]
            features = [scores[i], cumulative_study, i + 1]
            X_train.append(features)
            
            # Target: The very next score they got
            y_train.append(scores[i + 1])

        # Prepare test case for the NEXT prediction
        next_attempt_num = len(scores) + 1
        X_test = [[scores[-1], study_minutes, next_attempt_num]]

        # Train Random Forest
        model = RandomForestRegressor(n_estimators=50, max_depth=5, random_state=42)
        model.fit(X_train, y_train)

        # Predict
        prediction = model.predict(X_test)[0]
        
        # Clamp between 0 and 100
        return float(np.clip(prediction, 0.0, 100.0))

    @staticmethod
    def _baseline_prediction(scores: list[float], study_minutes: int) -> float:
        if not scores:
            return 0.0
        
        recent_avg = sum(scores[-3:]) / min(len(scores), 3)
        # 2.5 points per hour of study, up to 15 points
        effort_bonus = min(15.0, (study_minutes / 60.0) * 2.5) 
        predicted = recent_avg + effort_bonus
        return min(100.0, max(0.0, predicted))
