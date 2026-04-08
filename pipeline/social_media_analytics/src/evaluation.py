"""Evaluation plots for the two-stage social media analytics model."""
from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.metrics import (
    PrecisionRecallDisplay,
    RocCurveDisplay,
    r2_score,
)

from src.config import FIGURES_DIR

_FIGSIZE = (7, 5)


def _save(fig: plt.Figure, name: str, out_dir: Path | None) -> None:
    out_dir = Path(out_dir) if out_dir else FIGURES_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / name
    fig.savefig(path, dpi=150, bbox_inches="tight")
    print(f"Saved → {path}")


# ── Stage 1 ───────────────────────────────────────────────────────────────────

def plot_stage1_curves(
    model,
    X_test: pd.DataFrame,
    y_test,
    out_dir: Path | None = None,
) -> None:
    """ROC and Precision-Recall curves for the Stage 1 classifier."""
    y_score = model.predict_proba_stage1(X_test)

    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    RocCurveDisplay.from_predictions(y_test, y_score, ax=axes[0])
    axes[0].set_title("Stage 1 — ROC Curve")
    axes[0].plot([0, 1], [0, 1], "k--", lw=0.8)

    PrecisionRecallDisplay.from_predictions(y_test, y_score, ax=axes[1])
    axes[1].set_title("Stage 1 — Precision-Recall Curve")

    fig.tight_layout()
    _save(fig, "stage1_roc_pr.png", out_dir)
    plt.close(fig)


# ── Stage 2 ───────────────────────────────────────────────────────────────────

def plot_stage2_residuals(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    out_dir: Path | None = None,
) -> None:
    """Residual plot for the Stage 2 regressor (log1p scale)."""
    residuals = y_true - y_pred
    r2 = r2_score(y_true, y_pred)

    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    axes[0].scatter(y_pred, residuals, alpha=0.4, s=20)
    axes[0].axhline(0, color="red", lw=1)
    axes[0].set_xlabel("Predicted log1p(value)")
    axes[0].set_ylabel("Residual")
    axes[0].set_title(f"Stage 2 — Residuals vs Fitted  (R²={r2:.3f})")

    axes[1].hist(residuals, bins=30, edgecolor="white")
    axes[1].axvline(0, color="red", lw=1)
    axes[1].set_xlabel("Residual")
    axes[1].set_title("Stage 2 — Residual Distribution")

    fig.tight_layout()
    _save(fig, "stage2_residuals.png", out_dir)
    plt.close(fig)


# ── Feature importance ────────────────────────────────────────────────────────

def plot_feature_importance(
    importances: np.ndarray,
    feature_names: list[str],
    title: str = "Feature Importance",
    top_n: int = 20,
    out_dir: Path | None = None,
) -> None:
    """Horizontal bar chart of the top-N features by importance."""
    idx   = np.argsort(importances)[-top_n:]
    names = [feature_names[i] for i in idx]
    vals  = importances[idx]

    fig, ax = plt.subplots(figsize=_FIGSIZE)
    ax.barh(names, vals)
    ax.set_xlabel("Importance")
    ax.set_title(title)
    fig.tight_layout()
    safe_name = title.lower().replace(" ", "_") + ".png"
    _save(fig, safe_name, out_dir)
    plt.close(fig)


# ── Descriptive analytics ─────────────────────────────────────────────────────

def plot_platform_breakdown(
    df: pd.DataFrame,
    target_col: str = "estimated_donation_value_php",
    out_dir: Path | None = None,
) -> None:
    """Mean donation value by platform."""
    summary = (
        df.groupby("platform")[target_col]
        .mean()
        .sort_values(ascending=False)
    )

    fig, ax = plt.subplots(figsize=_FIGSIZE)
    summary.plot(kind="bar", ax=ax, edgecolor="white")
    ax.set_xlabel("Platform")
    ax.set_ylabel(f"Mean {target_col} (PHP)")
    ax.set_title("Mean Donation Value by Platform")
    ax.tick_params(axis="x", rotation=30)
    fig.tight_layout()
    _save(fig, "platform_breakdown.png", out_dir)
    plt.close(fig)


def plot_post_type_breakdown(
    df: pd.DataFrame,
    target_col: str = "estimated_donation_value_php",
    out_dir: Path | None = None,
) -> None:
    """Mean donation value by post type."""
    summary = (
        df.groupby("post_type")[target_col]
        .mean()
        .sort_values(ascending=False)
    )

    fig, ax = plt.subplots(figsize=_FIGSIZE)
    summary.plot(kind="bar", ax=ax, edgecolor="white")
    ax.set_xlabel("Post Type")
    ax.set_ylabel(f"Mean {target_col} (PHP)")
    ax.set_title("Mean Donation Value by Post Type")
    ax.tick_params(axis="x", rotation=30)
    fig.tight_layout()
    _save(fig, "post_type_breakdown.png", out_dir)
    plt.close(fig)
