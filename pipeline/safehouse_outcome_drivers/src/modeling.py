"""
Phase 4 — PanelOLS modeling utilities.

Estimator : linearmodels.PanelOLS with safehouse entity effects (within estimator)
SE type   : heteroscedasticity-robust (HC1-equivalent White sandwich estimator).
            HC3 is not available for panel entity-effects models; HC1 is standard.
R² metric : within-R² (variation explained after removing entity-level means).

Region dummies are excluded from the formula: each safehouse belongs to exactly
one region, making region perfectly collinear with the entity FE dummies.
Entity effects implicitly absorb all time-invariant safehouse-level variation,
including region.

occupancy_rate is also excluded: safehouse capacity is fixed, so occupancy_rate
has near-zero within-entity variance and is fully absorbed by entity FE.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from linearmodels.panel import PanelOLS
from pathlib import Path

from .config import (
    OUTCOME_HEALTH,
    OUTCOME_EDUCATION,
    REGRESSION_FEATURES,
)

# Standardised predictor names written by Phase 3 / src/features.py.
# occupancy_rate excluded: near-zero within-entity variance; absorbed by entity FE.
_EXCLUDED = {"occupancy_rate"}
MODEL_FEATURES_STD: list[str] = [
    f"{f}_std" for f in REGRESSION_FEATURES if f not in _EXCLUDED
]


# ── Panel index ───────────────────────────────────────────────────────────────

def build_panel_index(df: pd.DataFrame) -> pd.DataFrame:
    """
    Return df with a (safehouse_id, month_start) MultiIndex required by
    linearmodels.  Sorts ascending so within-group time ordering is correct.
    """
    out = df.copy()
    out["month_start"] = pd.to_datetime(out["month_start"])
    return out.set_index(["safehouse_id", "month_start"]).sort_index()


# ── Formula ───────────────────────────────────────────────────────────────────

def build_formula(outcome: str) -> str:
    """Patsy formula string for linearmodels PanelOLS (EntityEffects keyword)."""
    rhs = " + ".join(MODEL_FEATURES_STD)
    return f"{outcome} ~ {rhs} + EntityEffects"


# ── Fit ───────────────────────────────────────────────────────────────────────

def run_panel_ols(panel: pd.DataFrame, outcome: str):
    """
    Fit PanelOLS with safehouse entity effects and HC1-robust standard errors.

    Parameters
    ----------
    panel   : DataFrame with (safehouse_id, month_start) MultiIndex
    outcome : column name of the dependent variable

    Returns
    -------
    linearmodels PanelEffectsResults object
    """
    formula = build_formula(outcome)
    model = PanelOLS.from_formula(formula, data=panel, drop_absorbed=True)
    return model.fit(cov_type="robust")


# ── Coefficient table ─────────────────────────────────────────────────────────

def _stars(p: float) -> str:
    if p < 0.001: return "***"
    if p < 0.01:  return "**"
    if p < 0.05:  return "*"
    if p < 0.10:  return "."
    return ""


def extract_coef_table(res_a, res_b) -> pd.DataFrame:
    """
    Build a side-by-side coefficient table for Model A (health) and Model B
    (education).

    Columns : beta_A, se_A, p_A, sig_A, beta_B, se_B, p_B, sig_B
    Rows    : the 7 standardised predictors
    """
    def _side(res, suffix: str) -> pd.DataFrame:
        rows = {}
        for f in MODEL_FEATURES_STD:
            if f in res.params.index:
                rows[f] = {
                    f"beta_{suffix}": round(float(res.params[f]),     4),
                    f"se_{suffix}":   round(float(res.std_errors[f]), 4),
                    f"p_{suffix}":    round(float(res.pvalues[f]),     4),
                    f"sig_{suffix}":  _stars(float(res.pvalues[f])),
                }
            else:
                rows[f] = {
                    f"beta_{suffix}": np.nan, f"se_{suffix}": np.nan,
                    f"p_{suffix}":    np.nan, f"sig_{suffix}": "",
                }
        return pd.DataFrame(rows).T

    return _side(res_a, "A").join(_side(res_b, "B"))


# ── Residuals ─────────────────────────────────────────────────────────────────

def compute_residuals(res_a, res_b) -> pd.DataFrame:
    """
    Compute per-safehouse residual variance for both models and flag outliers.

    By construction of the within (FE) estimator, entity-level mean residuals
    are exactly zero — mean-based flagging is uninformative.  Variance-based
    flagging identifies safehouses whose outcomes are systematically harder to
    explain (high unexplained volatility).

    Flags safehouses whose residual variance exceeds (mean + 2 SD) of the
    variance distribution across all safehouses.

    Returns a DataFrame indexed by safehouse_id with columns:
        var_A, var_B, var_A_flag, var_B_flag
    """
    resid = pd.DataFrame({
        "resid_A": res_a.resids,
        "resid_B": res_b.resids,
    })
    by_sh = resid.groupby(level="safehouse_id").var()
    by_sh.columns = ["var_A", "var_B"]

    for col in ["var_A", "var_B"]:
        mu, sd = by_sh[col].mean(), by_sh[col].std()
        by_sh[f"{col}_flag"] = by_sh[col] > (mu + 2 * sd)

    return by_sh


# ── Save ─────────────────────────────────────────────────────────────────────

def save_coef_csv(coef_table: pd.DataFrame, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    coef_table.to_csv(path)
    print(f"Coefficient table → {path}")
