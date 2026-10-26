"""Training pipeline tests (fixture generation + metrics honesty)."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path[:0] = [str(Path(__file__).resolve().parents[1])]


def test_fixture_is_deterministic_and_labelled(tmp_path: Path):
    from training.make_fixture import generate_fixture

    a = generate_fixture(rows_per_class=10)
    b = generate_fixture(rows_per_class=10)
    assert a.equals(b), "fixture generation must be seeded/deterministic"
    assert "fixture" in "crop-disease-fixture.csv"
    assert (a["target"].value_counts() > 0).all()


def test_full_training_pipeline_produces_metrics_and_artifacts(tmp_path: Path):
    from training.make_fixture import generate_fixture
    from training.train import train

    csv_path = tmp_path / "fixture-small.csv"
    generate_fixture(rows_per_class=40).to_csv(csv_path, index=False)
    artifacts_dir = tmp_path / "artifacts"  # keep the real serving artifacts untouched
    metadata = train(csv_path, artifacts_dir)

    assert metadata["artifactDir"] == str(artifacts_dir)

    assert "fixture" in metadata["dataset"]["name"]
    assert "SYNTHETIC" in metadata["dataset"]["nature"].upper()
    metrics = metadata["metrics"]
    assert metrics["heldOutTestSize"] > 0
    # the fixture is learnable: final model must beat a trivial baseline
    assert metrics["macroF1"] > metadata["baselines"]["dummy-most-frequent"]
    assert len(metrics["perClass"]) >= 3
    assert metadata["preprocessing"]["seed"] == 42
