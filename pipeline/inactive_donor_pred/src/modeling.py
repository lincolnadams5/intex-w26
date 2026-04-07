"""Model definitions and tuning helpers."""
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from src.config import SEED


def build_preprocessor(numeric_cols, categorical_cols):
    numeric_pipe = Pipeline([
        ("impute", SimpleImputer(strategy="median")),
        ("scale", StandardScaler()),
    ])
    categorical_pipe = Pipeline([
        ("impute", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    return ColumnTransformer(
        [("num", numeric_pipe, numeric_cols), ("cat", categorical_pipe, categorical_cols)],
        remainder="drop",
    )


def get_candidate_pipelines(preprocessor) -> dict:
    """Return baseline candidate model pipelines."""
    return {
        "LogReg": Pipeline([
            ("prep", preprocessor),
            ("model", LogisticRegression(max_iter=2000, class_weight="balanced", random_state=SEED)),
        ]),
        "RandomForest": Pipeline([
            ("prep", preprocessor),
            ("model", RandomForestClassifier(n_estimators=300, class_weight="balanced", random_state=SEED, n_jobs=-1)),
        ]),
    }
