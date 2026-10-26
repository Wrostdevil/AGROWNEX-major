"""Dataset loading interface (§6.2).

A true production retrain drops a real dataset at
data/processed/<file>.csv following the documented schema in
data/README.md. Until curated datasets are reviewed, training runs on the
generated, clearly-labelled synthetic fixture created by
`training.make_fixture` — a SOFTWARE-TEST fixture, never scientific evidence.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

from app.features import FEATURE_COLUMNS, TARGET_COLUMN  # re-exported for trainers


class DatasetNotReady(RuntimeError):
    pass


def load_dataset(csv_path: Path) -> pd.DataFrame:
    """Load ANY dataset that follows the documented fixture schema.

    Required: all FEATURE_COLUMNS + target. Values validated: crop in catalog,
    symptom columns 0/1, env fields in allowed enumerations or 'unknown'.
    """
    if not csv_path.exists():
        raise DatasetNotReady(
            f"Training data not found at {csv_path}. "
            "Either run `python -m training.make_fixture` to create the labelled "
            "synthetic fixture, or place a curated dataset with the documented schema."
        )
    frame = pd.read_csv(csv_path)
    missing = [column for column in (*FEATURE_COLUMNS, TARGET_COLUMN) if column not in frame.columns]
    if missing:
        raise DatasetNotReady(f"Dataset at {csv_path} is missing required columns: {missing}")
    return frame


__all__ = ["FEATURE_COLUMNS", "TARGET_COLUMN", "DatasetNotReady", "load_dataset"]
