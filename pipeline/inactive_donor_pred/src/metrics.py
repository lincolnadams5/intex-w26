"""Metric helpers and baseline computations."""
import numpy as np
import pandas as pd
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, average_precision_score,
    f1_score, precision_score, recall_score,
)


def majority_class_baseline(y) -> float:
    """Return accuracy of always predicting the majority class."""
    counts = pd.Series(y).value_counts(normalize=True)
    return float(counts.max())


def report_classification(y_true, y_pred, y_prob=None):
    """Print full classification report with optional AUC metrics."""
    baseline = majority_class_baseline(y_true)
    print(f"Majority-class baseline accuracy : {baseline:.4f}")
    print()
    print(classification_report(y_true, y_pred, digits=4))
    print("Confusion matrix:")
    print(confusion_matrix(y_true, y_pred))
    if y_prob is not None:
        roc = roc_auc_score(y_true, y_prob)
        ap = average_precision_score(y_true, y_prob)
        print(f"\nROC AUC:           {roc:.4f}")
        print(f"Avg Precision (AP): {ap:.4f}")
