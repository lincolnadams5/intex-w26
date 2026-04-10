# Safehouse Outcome Drivers — Executive Summary

**Project:** Pag-asa Safehouse Outcome Drivers Analysis  
**Date:** 2026-04-09  
**Pipeline phase:** CRISP-DM Phase 5 (Evaluation)  
**Audience:** Pag-asa programme team

---

## What We Did

We built a statistical model that looks at monthly programme inputs across all 9 Pag-asa safehouses and asks: **when a safehouse does more of X, does resident health or education tend to improve?**

The model controls for each safehouse's own baseline level — so it only measures changes *within* a safehouse over time, not differences between safehouses.

---

## What the Model Found

### How much does it explain?

| Outcome | Variation explained by programme inputs |
|---|---|
| Resident health scores | **28.5%** of month-to-month variation |
| Education progress | **20.3%** of month-to-month variation |

The remaining variation reflects factors we cannot observe in the monthly data — staffing quality, individual resident history, external circumstances. This is expected. The model is a **monitoring tool**, not a prediction engine.

---

### Which inputs are most associated with outcomes?

**Health scores:**

| Programme input | Direction | What it means |
|---|---|---|
| Time since safehouse opened | Higher health in older safehouses | Accumulated programme learning; strong signal |
| % high-risk residents (previous month) | Lower health this month | High-risk caseload carries over; timely screening matters |
| % trafficked residents | Lower health in same month | Trafficking sub-category associated with worse health baseline |
| Home visit rate (previous month) | Lower health this month | Likely reflects reactive outreach — visits increase when residents are unwell, not the cause of poor health |
| % special needs residents (previous month) | Higher health this month | May reflect targeted support allocation for this group |

**Education progress:**

| Programme input | Direction | What it means |
|---|---|---|
| Group sessions (previous month) | Higher education progress this month | Clearest signal: programme sessions delivered last month pay off in education gains this month |
| % special needs residents | Lower education progress | Higher special-needs prevalence in a month is associated with lower average education progress |

---

## Flagged Safehouses

One safehouse showed **unusually high month-to-month volatility** in health scores that the model cannot account for — meaning its outcomes swing more than the programme inputs alone would predict.

| Safehouse | Region | Flagged for | Action |
|---|---|---|---|
| Safehouse 1 | Luzon | Health score volatility | Case review recommended |

No safehouses were flagged for education volatility.

---

## Key Limitations

1. **Risk level is a current snapshot** — the resident risk-level field reflects today's classification, not what it was in each historical month. The model's risk-related findings should be treated as approximate directional signals.

2. **9 safehouses is a small group** — regional patterns and differences between safehouse types cannot be measured; they are absorbed into each safehouse's fixed baseline.

3. **Unobserved factors dominate** — staff turnover, trauma history, programme fidelity, and external events are not in the data. Coefficients reflect associations, not proven causes.

---

## Recommendation

**Proceed with dashboard integration.**

The analysis provides a statistically valid, monthly-refreshable picture of which programme inputs co-vary with resident outcomes. Use it to:

- **Monitor flagged safehouses** — review Safehouse 1 for unexplained health volatility
- **Prioritise group sessions** — sessions delivered one month prior show the clearest link to education gains
- **Watch resident composition** — high-risk and trafficked caseload is associated with lower health outcomes; ensure adequate resourcing when composition shifts

**Re-run the pipeline monthly** after metrics are entered to refresh the flagged-safehouse list.
