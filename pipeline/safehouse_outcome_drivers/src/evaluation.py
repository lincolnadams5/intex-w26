"""
evaluation.py — Phase 5 evaluation utilities for the safehouse outcome drivers pipeline.

Public API
----------
    load_fitted_models(panel_csv)   -> (df_raw, panel_indexed, res_a, res_b)
    flag_safehouses_report(resid_by_sh, df_raw) -> pd.DataFrame
    save_flagged_csv(flagged_df, reports_dir)   -> Path
    plot_residual_time_series(res_a, res_b, panel_indexed, flagged_health, flagged_edu)
"""
from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from .config import OUTCOME_HEALTH, OUTCOME_EDUCATION
from .modeling import build_panel_index, run_panel_ols, compute_residuals


# ── Model loading ─────────────────────────────────────────────────────────────

def load_fitted_models(
    panel_csv: Path,
    verbose: bool = True,
) -> tuple[pd.DataFrame, pd.DataFrame, object, object]:
    """
    Load the processed panel CSV, fit both PanelOLS models, return all four
    objects needed by the evaluation notebook and downstream jobs.

    Returns
    -------
    df_raw        : raw DataFrame (with original column names)
    panel_indexed : MultiIndex DataFrame passed to linearmodels
    res_a         : PanelEffectsResults for avg_health_score
    res_b         : PanelEffectsResults for avg_education_progress
    """
    df_raw = pd.read_csv(panel_csv)
    if verbose:
        print(f"[evaluation] Panel loaded: {len(df_raw):,} rows × {len(df_raw.columns)} columns")

    panel_indexed = build_panel_index(df_raw)
    res_a = run_panel_ols(panel_indexed, OUTCOME_HEALTH)
    res_b = run_panel_ols(panel_indexed, OUTCOME_EDUCATION)

    if verbose:
        print(f"[evaluation] Health    within-R² = {res_a.rsquared:.4f}")
        print(f"[evaluation] Education within-R² = {res_b.rsquared:.4f}")

    return df_raw, panel_indexed, res_a, res_b


# ── Flagged-safehouse report ──────────────────────────────────────────────────

def flag_safehouses_report(
    resid_by_sh: pd.DataFrame,
    df_raw: pd.DataFrame,
) -> pd.DataFrame:
    """
    Merge residual variance flags with safehouse metadata (region) and annotate
    each flagged safehouse with a plain-language reason.

    Parameters
    ----------
    resid_by_sh : output of modeling.compute_residuals()
    df_raw      : raw panel DataFrame (must contain safehouse_id + region)

    Returns
    -------
    pd.DataFrame with columns:
        safehouse_id, region, var_A, var_B, var_A_flag, var_B_flag,
        flagged_for, note
    """
    meta = (
        df_raw[["safehouse_id", "region"]]
        .drop_duplicates("safehouse_id")
        .set_index("safehouse_id")
    )
    report = resid_by_sh.join(meta)
    report = report.reset_index()

    def _reason(row) -> str:
        flags = []
        if row["var_A_flag"]:
            flags.append("health")
        if row["var_B_flag"]:
            flags.append("education")
        return ", ".join(flags) if flags else "—"

    report["flagged_for"] = report.apply(_reason, axis=1)
    report["note"] = report["flagged_for"].apply(
        lambda f: (
            "Residual variance > mean + 2 SD: outcomes harder to explain with "
            "observed programme inputs. Recommend case review."
        ) if f != "—" else ""
    )

    cols = ["safehouse_id", "region", "var_A", "var_B", "var_A_flag", "var_B_flag",
            "flagged_for", "note"]
    return report[cols].sort_values("safehouse_id").reset_index(drop=True)


def save_flagged_csv(flagged_df: pd.DataFrame, reports_dir: Path) -> Path:
    """Save the flagged-safehouses report to reports/tables/flagged_safehouses.csv."""
    out = reports_dir / "tables" / "flagged_safehouses.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    flagged_df.to_csv(out, index=False)
    print(f"[evaluation] Flagged safehouses -> {out}")
    return out


# ── Residual time-series plot ─────────────────────────────────────────────────

def plot_residual_time_series(
    res_a,
    res_b,
    panel_indexed: pd.DataFrame,
    flagged_health: list[int],
    flagged_edu: list[int],
) -> plt.Figure:
    """
    Plot residuals over time for each flagged safehouse.

    For non-flagged safehouses, residuals are plotted as faint grey lines to
    provide context. Flagged safehouses are drawn in colour with labels.

    One subplot per outcome model; returned Figure is not shown (caller decides).
    """
    resid_df = pd.DataFrame({
        "resid_health": res_a.resids,
        "resid_edu":    res_b.resids,
    })
    resid_df.index = panel_indexed.index  # restore MultiIndex

    all_sh = resid_df.index.get_level_values("safehouse_id").unique()
    fig, axes = plt.subplots(1, 2, figsize=(14, 5), sharey=False)

    specs = [
        (axes[0], "resid_health", flagged_health, f"Model A — {OUTCOME_HEALTH}"),
        (axes[1], "resid_edu",    flagged_edu,    f"Model B — {OUTCOME_EDUCATION}"),
    ]

    palette = plt.rcParams["axes.prop_cycle"].by_key()["color"]

    for ax, col, flagged, title in specs:
        for sh in all_sh:
            sub = resid_df.xs(sh, level="safehouse_id")[col]
            if sh in flagged:
                color = palette[flagged.index(sh) % len(palette)]
                ax.plot(sub.index, sub.values, color=color, linewidth=1.8,
                        label=f"SH {sh} (flagged)", zorder=3)
            else:
                ax.plot(sub.index, sub.values, color="lightgrey",
                        linewidth=0.7, zorder=1)

        ax.axhline(0, color="black", linewidth=0.8, linestyle="--", alpha=0.5)
        ax.set_title(title, fontsize=10)
        ax.set_xlabel("Month")
        ax.set_ylabel("Residual (actual − fitted)")
        ax.tick_params(axis="x", rotation=45)
        if flagged:
            ax.legend(fontsize=8)

    plt.suptitle(
        "Residuals Over Time — Flagged Safehouses Highlighted\n"
        "(grey lines = safehouses within normal residual range)",
        fontsize=11,
    )
    plt.tight_layout()
    return fig
