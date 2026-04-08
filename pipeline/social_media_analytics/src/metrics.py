"""Metric helpers for the two-stage model."""
from __future__ import annotations

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    roc_auc_score,
    mean_absolute_error,
    r2_score,
)


def baseline_classifier(y) -> float:
    """Majority-class accuracy baseline."""
    values, counts = np.unique(y, return_counts=True)
    return counts.max() / counts.sum()


def report_two_stage(
    y_true_binary,
    y_pred_binary,
    y_pred_proba,
    y_true_log,
    y_pred_log,
) -> None:
    """
    Print a combined metric report for both stages.

    Parameters
    ----------
    y_true_binary : array-like  True binary labels (has_donation).
    y_pred_binary : array-like  Predicted binary labels.
    y_pred_proba  : array-like  Predicted probabilities for Stage 1.
    y_true_log    : array-like  True log1p(value) for positive cases only.
    y_pred_log    : array-like  Predicted log1p(value) for positive cases only.
    """
    print("── Stage 1: Binary Classifier (has_donation) ──────────────────")
    print(f"  Majority baseline accuracy : {baseline_classifier(y_true_binary):.4f}")
    print(f"  ROC AUC                    : {roc_auc_score(y_true_binary, y_pred_proba):.4f}")
    print(f"  Accuracy                   : {accuracy_score(y_true_binary, y_pred_binary):.4f}")
    print()
    print(classification_report(y_true_binary, y_pred_binary, target_names=["No Donation", "Has Donation"]))

    print("── Stage 2: Regression (log1p donation value, positives only) ─")
    baseline_mae = mean_absolute_error(y_true_log, np.full_like(y_true_log, np.mean(y_true_log)))
    print(f"  Baseline MAE (mean pred)   : {baseline_mae:.4f}")
    print(f"  MAE                        : {mean_absolute_error(y_true_log, y_pred_log):.4f}")
    print(f"  R²                         : {r2_score(y_true_log, y_pred_log):.4f}")
    print()
