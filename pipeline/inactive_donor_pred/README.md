# Inactive Donor Prediction

Binary classification model to identify donors at risk of going inactive within 90 days.

## Project Structure

```
inactive_donor_pred/
  data/raw/          # immutable source CSVs (supporters, donations)
  data/interim/      # intermediate transforms
  data/processed/    # modeling-ready tables
  notebooks/         # CRISP-DM phase notebooks (01–05) + master
  src/               # shared feature/model/eval logic
  jobs/              # train_model.py, run_inference.py
  artifacts/         # saved model pipelines + run metadata
  reports/           # figures, tables, executive summary
  logs/
```

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env  # add SUPABASE_URL and SUPABASE_KEY
```

## Running

```bash
# Train
python -m jobs.train_model

# Score active donors → writes to donor_risk_scores in Supabase
python -m jobs.run_inference
```

## Label Definition

`at_risk = 1` if a donor has not made any donation in the last 90 days (configurable via `src/config.py:AT_RISK_DAYS`).

## Positive Class

`1 = at risk of going inactive`
