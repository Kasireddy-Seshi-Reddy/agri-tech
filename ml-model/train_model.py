"""
Train a Random Forest Classifier for crop recommendation
based on soil nutrient data (N, P, K, temperature, humidity, pH).

Outputs:
  - crop_model.pkl    (trained Random Forest model)
  - label_encoder.pkl (LabelEncoder for crop labels)

Usage:
  python train_model.py
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib


def main():
    # ── 1. Load dataset ─────────────────────────────────────────────
    dataset_path = os.path.join(os.path.dirname(__file__), "dataset.csv")
    df = pd.read_csv(dataset_path)

    print(f"Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"Crops in dataset: {df['label'].nunique()}")
    print(f"Crop list: {sorted(df['label'].unique())}\n")

    # ── 2. Prepare features and labels ──────────────────────────────
    feature_cols = ["N", "P", "K", "temperature", "humidity", "ph"]
    X = df[feature_cols].values
    y = df["label"].values

    # Encode crop labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    print(f"Features shape: {X.shape}")
    print(f"Classes: {le.classes_}\n")

    # ── 3. Train / Test split ───────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    print(f"Training samples: {X_train.shape[0]}")
    print(f"Testing  samples: {X_test.shape[0]}\n")

    # ── 4. Train Random Forest ──────────────────────────────────────
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    # ── 5. Evaluate ─────────────────────────────────────────────────
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    print("=" * 60)
    print(f"  Model Accuracy: {accuracy * 100:.2f}%")
    print("=" * 60)
    print()
    print("Classification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    # ── 6. Feature importance ───────────────────────────────────────
    importances = model.feature_importances_
    print("\nFeature Importances:")
    for feat, imp in sorted(
        zip(feature_cols, importances), key=lambda x: x[1], reverse=True
    ):
        print(f"  {feat:>15s}: {imp:.4f}")

    # ── 7. Save model artefacts ─────────────────────────────────────
    model_dir = os.path.dirname(__file__)
    model_path = os.path.join(model_dir, "crop_model.pkl")
    encoder_path = os.path.join(model_dir, "label_encoder.pkl")

    joblib.dump(model, model_path)
    joblib.dump(le, encoder_path)

    print(f"\n[OK] Model saved to:   {model_path}")
    print(f"[OK] Encoder saved to: {encoder_path}")
    print("\nTraining complete. You can now run app.py to start the API.")


if __name__ == "__main__":
    main()
