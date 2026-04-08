"""
Evaluation plots and summary helpers.
"""

import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    RocCurveDisplay,
    PrecisionRecallDisplay,
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
)


def plot_cv_comparison(results: dict, figsize=(10, 4)):
    """
    Bar chart comparing CV Precision and F1 across candidate models.
    `results` is a dict: {model_name: {'precision_mean': float, 'f1_mean': float, ...}}
    """
    names = list(results.keys())
    prec_means = [results[n]["precision_mean"] for n in names]
    prec_stds  = [results[n]["precision_std"]  for n in names]
    f1_means   = [results[n]["f1_mean"]        for n in names]
    f1_stds    = [results[n]["f1_std"]         for n in names]

    x = np.arange(len(names))
    width = 0.35

    fig, ax = plt.subplots(figsize=figsize)
    ax.bar(x - width/2, prec_means, width, yerr=prec_stds, label="Precision", color="steelblue", capsize=5)
    ax.bar(x + width/2, f1_means,   width, yerr=f1_stds,   label="F1",        color="salmon",    capsize=5)
    ax.set_xticks(x)
    ax.set_xticklabels(names)
    ax.set_ylabel("Score")
    ax.set_title("5-Fold CV — Precision and F1 by Model")
    ax.set_ylim(0, 1.05)
    ax.axhline(0.70, color="gray", linestyle="--", alpha=0.5, label="0.70 reference")
    ax.legend()
    plt.tight_layout()
    return fig


def plot_confusion_and_curves(y_true, y_pred, y_prob, model_name, save_dir=None):
    """
    3-panel figure: confusion matrix | ROC curve | Precision-Recall curve.
    """
    fig, axes = plt.subplots(1, 3, figsize=(16, 5))

    # Confusion matrix
    ConfusionMatrixDisplay(
        confusion_matrix=confusion_matrix(y_true, y_pred),
        display_labels=["Not Ready", "Ready"],
    ).plot(ax=axes[0], cmap="Blues", colorbar=False)
    axes[0].set_title("Confusion Matrix")

    # ROC
    RocCurveDisplay.from_predictions(y_true, y_prob, ax=axes[1], name=model_name)
    axes[1].plot([0, 1], [0, 1], "k--", label="Chance")
    axes[1].set_title(f"ROC Curve  (AUC = {roc_auc_score(y_true, y_prob):.3f})")
    axes[1].legend()

    # Precision-Recall
    PrecisionRecallDisplay.from_predictions(y_true, y_prob, ax=axes[2], name=model_name)
    axes[2].axhline(y_true.mean(), color="k", linestyle="--", label="No-skill baseline")
    axes[2].set_title(f"PR Curve  (AP = {average_precision_score(y_true, y_prob):.3f})")
    axes[2].legend()

    plt.tight_layout()

    if save_dir is not None:
        fig.savefig(save_dir / "roc_pr_curves.png", dpi=150, bbox_inches="tight")

    return fig


def plot_threshold_tuning(y_true, y_prob, save_dir=None):
    """Precision / Recall / F1 vs decision threshold plot."""
    thresholds = np.arange(0.1, 0.9, 0.05)
    rows = []
    for t in thresholds:
        y_t = (y_prob >= t).astype(int)
        rows.append({
            "threshold": round(float(t), 2),
            "precision": precision_score(y_true, y_t, zero_division=0),
            "recall":    recall_score(y_true, y_t, zero_division=0),
            "f1":        f1_score(y_true, y_t, zero_division=0),
            "flagged":   int(y_t.sum()),
        })

    import pandas as pd
    df = pd.DataFrame(rows)

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(df["threshold"], df["precision"], label="Precision", color="steelblue", marker="o", ms=4)
    ax.plot(df["threshold"], df["recall"],    label="Recall",    color="salmon",    marker="o", ms=4)
    ax.plot(df["threshold"], df["f1"],        label="F1",        color="seagreen",  marker="o", ms=4)
    ax.axvline(0.5, color="gray", linestyle="--", label="Default (0.5)")
    ax.set_xlabel("Decision threshold")
    ax.set_ylabel("Score")
    ax.set_title("Precision / Recall / F1 vs Decision Threshold")
    ax.legend()
    plt.tight_layout()

    if save_dir is not None:
        fig.savefig(save_dir / "threshold_tuning.png", dpi=150, bbox_inches="tight")

    return fig, df


def plot_score_distribution(y_prob, y_true, save_dir=None):
    """Risk score distribution split by actual class."""
    import pandas as pd
    score_df = pd.DataFrame({"score": y_prob, "actual": y_true})

    fig, ax = plt.subplots(figsize=(9, 4))
    score_df[score_df["actual"] == 0]["score"].plot(
        kind="hist", bins=12, ax=ax, alpha=0.6, color="steelblue", label="Not Ready (actual)")
    score_df[score_df["actual"] == 1]["score"].plot(
        kind="hist", bins=12, ax=ax, alpha=0.6, color="salmon",    label="Ready (actual)")
    ax.set_xlabel("Readiness score")
    ax.set_ylabel("Count")
    ax.set_title("Readiness Score Distribution by Actual Class")
    ax.legend()
    plt.tight_layout()

    if save_dir is not None:
        fig.savefig(save_dir / "score_distribution.png", dpi=150, bbox_inches="tight")

    return fig
