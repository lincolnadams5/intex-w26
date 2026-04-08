"""Model architecture — TwoStageModel, preprocessor, and candidate factories."""
from __future__ import annotations

import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from src.config import SEED


# ── Preprocessing ─────────────────────────────────────────────────────────────

def build_preprocessor(numeric_cols: list[str], categorical_cols: list[str]) -> ColumnTransformer:
    numeric_pipe = Pipeline([
        ("impute", SimpleImputer(strategy="median")),
        ("scale",  StandardScaler()),
    ])
    categorical_pipe = Pipeline([
        ("impute", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    return ColumnTransformer(
        [
            ("num", numeric_pipe,      numeric_cols),
            ("cat", categorical_pipe,  categorical_cols),
        ],
        remainder="drop",
    )


# ── Candidate model factories ─────────────────────────────────────────────────

def get_candidate_classifiers(preprocessor: ColumnTransformer) -> dict[str, Pipeline]:
    """Binary classifier candidates for Stage 1 (has_donation)."""
    return {
        "LogReg": Pipeline([
            ("prep",  preprocessor),
            ("model", LogisticRegression(
                max_iter=2000, class_weight="balanced", random_state=SEED
            )),
        ]),
        "RandomForest": Pipeline([
            ("prep",  preprocessor),
            ("model", RandomForestClassifier(
                n_estimators=300, class_weight="balanced", random_state=SEED, n_jobs=-1
            )),
        ]),
    }


def get_candidate_regressors(preprocessor: ColumnTransformer) -> dict[str, Pipeline]:
    """Regression candidates for Stage 2 (log1p donation value, positive cases only)."""
    return {
        "Ridge": Pipeline([
            ("prep",  preprocessor),
            ("model", Ridge(random_state=SEED)),
        ]),
        "RandomForest": Pipeline([
            ("prep",  preprocessor),
            ("model", RandomForestRegressor(
                n_estimators=300, random_state=SEED, n_jobs=-1
            )),
        ]),
    }


# ── Two-stage model ───────────────────────────────────────────────────────────

class TwoStageModel:
    """
    Zero-inflated two-stage model.

    Stage 1 — binary classifier:  P(estimated_donation_value_php > 0)
    Stage 2 — regressor trained on log1p(value) for positive cases only.
    Combined prediction:  P(has_donation) × expm1(stage2_pred)
    """

    def __init__(self, classifier: Pipeline, regressor: Pipeline) -> None:
        self.classifier = classifier
        self.regressor  = regressor

    def fit(
        self,
        X: "pd.DataFrame",
        y_binary: "pd.Series",
        y_log_value: "pd.Series",
    ) -> "TwoStageModel":
        self.classifier.fit(X, y_binary)

        pos_mask = y_binary.values == 1
        self.regressor.fit(X[pos_mask], y_log_value.values[pos_mask])
        return self

    def predict_proba_stage1(self, X: "pd.DataFrame") -> np.ndarray:
        return self.classifier.predict_proba(X)[:, 1]

    def predict_stage1(self, X: "pd.DataFrame") -> np.ndarray:
        return self.classifier.predict(X)

    def predict_stage2(self, X: "pd.DataFrame") -> np.ndarray:
        return self.regressor.predict(X)

    def predict(self, X: "pd.DataFrame") -> np.ndarray:
        """Return expected donation value in PHP (combined stage output)."""
        p_donation = self.predict_proba_stage1(X)
        log_value  = self.predict_stage2(X)
        return p_donation * np.expm1(log_value)
