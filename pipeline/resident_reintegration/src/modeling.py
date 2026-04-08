"""
Model definitions and preprocessing pipeline builder.
"""

import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from src.config import SEED


def build_preprocessor(numeric_cols, categorical_cols):
    """
    Leakage-safe preprocessing pipeline.

    Numeric  : median imputation → StandardScaler
    Categorical: most-frequent imputation → OneHotEncoder (handle_unknown='ignore')

    Must be fitted only on training data inside a Pipeline.
    """
    numeric_pipe = Pipeline([
        ("impute", SimpleImputer(strategy="median")),
        ("scale",  StandardScaler()),
    ])
    categorical_pipe = Pipeline([
        ("impute",  SimpleImputer(strategy="most_frequent")),
        ("onehot",  OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    return ColumnTransformer(
        [
            ("num", numeric_pipe,     numeric_cols),
            ("cat", categorical_pipe, categorical_cols),
        ],
        remainder="drop",
    )


def build_candidate_pipelines(numeric_cols, categorical_cols):
    """
    Return a dict of named sklearn Pipeline objects for CV comparison.

    Both models use class_weight='balanced' as a precaution for any imbalance.
    Logistic Regression uses strong L2 regularization (C=0.1) for the small dataset.
    Random Forest uses shallow trees with high min_samples_leaf to prevent overfitting.
    """
    return {
        "LogisticRegression": Pipeline([
            ("prep",  build_preprocessor(numeric_cols, categorical_cols)),
            ("model", LogisticRegression(
                max_iter=2000,
                class_weight="balanced",
                C=0.01,              # very strong L2 regularization for small dataset (31 rows)
                solver="lbfgs",
                random_state=SEED,
            )),
        ]),
        "RandomForest": Pipeline([
            ("prep",  build_preprocessor(numeric_cols, categorical_cols)),
            ("model", RandomForestClassifier(
                n_estimators=200,
                max_depth=3,
                min_samples_leaf=4,  # prevent overfitting on 39 training samples
                class_weight="balanced",
                random_state=SEED,
                n_jobs=1,
            )),
        ]),
    }
