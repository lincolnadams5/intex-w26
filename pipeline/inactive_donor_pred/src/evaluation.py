"""Evaluation plots and reports."""
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from sklearn.metrics import (
    ConfusionMatrixDisplay, RocCurveDisplay, PrecisionRecallDisplay
)


def plot_confusion_matrix(model, X_test, y_test, title="Confusion Matrix"):
    fig, ax = plt.subplots(figsize=(5, 4))
    ConfusionMatrixDisplay.from_estimator(model, X_test, y_test, ax=ax, cmap="Blues")
    ax.set_title(title)
    plt.tight_layout()
    plt.show()


def plot_roc_pr(model, X_test, y_test):
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    RocCurveDisplay.from_estimator(model, X_test, y_test, ax=axes[0])
    axes[0].set_title("ROC Curve")
    PrecisionRecallDisplay.from_estimator(model, X_test, y_test, ax=axes[1])
    axes[1].set_title("Precision-Recall Curve")
    plt.tight_layout()
    plt.show()


def plot_feature_importance(model, feature_names, top_n=20):
    """Works for pipelines with a RandomForest or XGBoost final estimator."""
    estimator = model.named_steps.get("model") or model[-1]
    if not hasattr(estimator, "feature_importances_"):
        print("Model does not expose feature_importances_")
        return
    importances = estimator.feature_importances_
    idx = np.argsort(importances)[::-1][:top_n]
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.barh(range(top_n), importances[idx][::-1])
    ax.set_yticks(range(top_n))
    ax.set_yticklabels([feature_names[i] for i in idx][::-1])
    ax.set_title(f"Top {top_n} Feature Importances")
    plt.tight_layout()
    plt.show()
