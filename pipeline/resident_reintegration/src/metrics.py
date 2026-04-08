"""
Metric helpers and reporting utilities.

Primary metric: Precision on the positive class (Ready = 1).
Secondary metric: F1.
"""

import pandas as pd
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
)
from src.config import TARGET


def report_classification(y_true, y_pred, y_prob=None, label="Evaluation"):
    """Print a standard classification report with precision emphasis."""
    prec   = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1     = f1_score(y_true, y_pred, zero_division=0)

    print(f"\n{'=' * 55}")
    print(f"  {label}")
    print(f"{'=' * 55}")
    print(f"  Precision  : {prec:.4f}  ← primary metric (avoid false positives)")
    print(f"  Recall     : {recall:.4f}")
    print(f"  F1         : {f1:.4f}")

    if y_prob is not None:
        try:
            roc = roc_auc_score(y_true, y_prob)
            ap  = average_precision_score(y_true, y_prob)
            print(f"  ROC AUC    : {roc:.4f}")
            print(f"  Avg Prec   : {ap:.4f}")
        except Exception:
            pass

    print()
    print(classification_report(
        y_true, y_pred,
        target_names=["Not Ready (0)", "Ready (1)"],
        digits=4,
    ))
    print(f"Confusion matrix:\n{confusion_matrix(y_true, y_pred)}")
    print(f"  TN  FP")
    print(f"  FN  TP")

    return {"precision": prec, "recall": recall, "f1": f1}
