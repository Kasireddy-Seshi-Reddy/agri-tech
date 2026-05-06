"""
Flask API for Crop & Fertilizer Recommendation

Endpoints:
  POST /predict     → Predict best crop from soil parameters
  POST /fertilizer  → Get fertilizer recommendations for given NPK + crop

Runs on port 5001 to avoid conflict with Express (port 5000).
"""

import os
import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ── Load trained model artefacts ────────────────────────────────────
MODEL_DIR = os.path.dirname(__file__)
model = joblib.load(os.path.join(MODEL_DIR, "crop_model.pkl"))
label_encoder = joblib.load(os.path.join(MODEL_DIR, "label_encoder.pkl"))

print(f"[OK] Model loaded. Classes: {list(label_encoder.classes_)}")


# ── Crop information database ──────────────────────────────────────
CROP_INFO = {
    "rice": {
        "season": "Kharif (June–November)",
        "water_need": "High",
        "growth_period": "120–150 days",
        "ideal_soil": "Clay or loamy soil with good water retention",
    },
    "wheat": {
        "season": "Rabi (November–March)",
        "water_need": "Moderate",
        "growth_period": "120–150 days",
        "ideal_soil": "Well-drained loamy soil",
    },
    "maize": {
        "season": "Kharif / Rabi",
        "water_need": "Moderate",
        "growth_period": "80–110 days",
        "ideal_soil": "Well-drained sandy loam to clay loam",
    },
    "chickpea": {
        "season": "Rabi (October–March)",
        "water_need": "Low",
        "growth_period": "90–120 days",
        "ideal_soil": "Well-drained sandy or loamy soil",
    },
    "kidneybeans": {
        "season": "Kharif (June–September)",
        "water_need": "Moderate",
        "growth_period": "90–120 days",
        "ideal_soil": "Well-drained loamy soil",
    },
    "pigeonpeas": {
        "season": "Kharif (June–November)",
        "water_need": "Low–Moderate",
        "growth_period": "120–180 days",
        "ideal_soil": "Light sandy loam",
    },
    "mothbeans": {
        "season": "Kharif (July–October)",
        "water_need": "Very Low",
        "growth_period": "60–90 days",
        "ideal_soil": "Sandy to light loamy, drought-resistant",
    },
    "mungbean": {
        "season": "Kharif / Spring (March–June)",
        "water_need": "Low",
        "growth_period": "60–90 days",
        "ideal_soil": "Well-drained loamy soil",
    },
    "blackgram": {
        "season": "Kharif (June–September)",
        "water_need": "Low–Moderate",
        "growth_period": "80–100 days",
        "ideal_soil": "Heavy clay or loam soil",
    },
    "lentil": {
        "season": "Rabi (October–March)",
        "water_need": "Low",
        "growth_period": "100–120 days",
        "ideal_soil": "Sandy loam to clay loam",
    },
    "pomegranate": {
        "season": "Year-round (tropical)",
        "water_need": "Moderate",
        "growth_period": "5–7 months per fruiting cycle",
        "ideal_soil": "Well-drained sandy loam",
    },
    "banana": {
        "season": "Year-round (tropical)",
        "water_need": "High",
        "growth_period": "10–12 months",
        "ideal_soil": "Rich loamy soil with organic matter",
    },
    "mango": {
        "season": "Summer fruiting (March–June)",
        "water_need": "Low–Moderate",
        "growth_period": "3–6 years to first fruit",
        "ideal_soil": "Deep, well-drained loamy soil",
    },
    "grapes": {
        "season": "Rabi / Perennial",
        "water_need": "Moderate",
        "growth_period": "Perennial, fruiting in 2–3 years",
        "ideal_soil": "Well-drained sandy clay loam",
    },
    "watermelon": {
        "season": "Summer (February–May)",
        "water_need": "High",
        "growth_period": "80–100 days",
        "ideal_soil": "Sandy loam, rich in organic matter",
    },
    "muskmelon": {
        "season": "Summer (February–May)",
        "water_need": "Moderate",
        "growth_period": "70–90 days",
        "ideal_soil": "Well-drained sandy loam",
    },
    "apple": {
        "season": "Temperate (April–October)",
        "water_need": "Moderate",
        "growth_period": "3–5 years to first fruit",
        "ideal_soil": "Well-drained loamy soil, pH 5.8–7.0",
    },
    "orange": {
        "season": "Year-round (subtropical)",
        "water_need": "Moderate",
        "growth_period": "10–15 months per cycle",
        "ideal_soil": "Well-drained sandy loam",
    },
    "papaya": {
        "season": "Year-round (tropical)",
        "water_need": "Moderate–High",
        "growth_period": "9–12 months",
        "ideal_soil": "Well-drained sandy loam, rich in organic matter",
    },
    "coconut": {
        "season": "Year-round (tropical)",
        "water_need": "High",
        "growth_period": "5–6 years to first fruit",
        "ideal_soil": "Sandy loam, laterite, or alluvial soils",
    },
    "cotton": {
        "season": "Kharif (April–November)",
        "water_need": "Moderate",
        "growth_period": "150–180 days",
        "ideal_soil": "Deep black cotton soil (vertisol)",
    },
    "jute": {
        "season": "Kharif (March–July)",
        "water_need": "High",
        "growth_period": "120–150 days",
        "ideal_soil": "Alluvial or loamy soil with high humidity",
    },
    "coffee": {
        "season": "Year-round shade crop",
        "water_need": "Moderate",
        "growth_period": "3–4 years to first fruit",
        "ideal_soil": "Well-drained volcanic or laterite soil",
    },
    "sugarcane": {
        "season": "Year-round (tropical/subtropical)",
        "water_need": "High",
        "growth_period": "12–18 months",
        "ideal_soil": "Deep, well-drained loamy soil",
    },
}


# ── Fertilizer recommendation logic ────────────────────────────────
def get_fertilizer_recommendations(n, p, k, crop):
    """Rule-based fertilizer recommendation using NPK thresholds."""
    recommendations = []

    # Nitrogen assessment
    if n < 40:
        recommendations.append({
            "nutrient": "Nitrogen",
            "status": "Low",
            "fertilizer": "Urea (46-0-0)",
            "reason": f"Nitrogen level is low at {n} mg/kg. Urea is highly effective for quick nitrogen supplementation. Apply 50–100 kg/ha depending on crop stage.",
            "alternative": "Ammonium Sulphate (21-0-0-24S) if sulphur deficiency is also suspected.",
        })
    elif n < 80:
        recommendations.append({
            "nutrient": "Nitrogen",
            "status": "Moderate",
            "fertilizer": "DAP (18-46-0)",
            "reason": f"Nitrogen at {n} mg/kg is moderate. DAP provides both nitrogen and phosphorus. Apply as basal dose at 50 kg/ha.",
            "alternative": "CAN (Calcium Ammonium Nitrate) for sustained release.",
        })
    else:
        recommendations.append({
            "nutrient": "Nitrogen",
            "status": "Sufficient",
            "fertilizer": "No additional nitrogen needed",
            "reason": f"Nitrogen at {n} mg/kg is sufficient. Over-application may cause nutrient burn and groundwater contamination.",
            "alternative": "Monitor levels; apply organic compost for maintenance.",
        })

    # Phosphorus assessment
    if p < 30:
        recommendations.append({
            "nutrient": "Phosphorus",
            "status": "Low",
            "fertilizer": "Single Super Phosphate (SSP) (0-16-0)",
            "reason": f"Phosphorus is low at {p} mg/kg. SSP is cost-effective and also provides calcium and sulphur. Apply 100–150 kg/ha.",
            "alternative": "DAP (18-46-0) for combined N+P supplementation.",
        })
    elif p < 60:
        recommendations.append({
            "nutrient": "Phosphorus",
            "status": "Moderate",
            "fertilizer": "DAP (18-46-0)",
            "reason": f"Phosphorus at {p} mg/kg is moderate. DAP as basal application at 50 kg/ha will maintain adequate levels.",
            "alternative": "Bone meal for organic farming approaches.",
        })
    else:
        recommendations.append({
            "nutrient": "Phosphorus",
            "status": "Sufficient",
            "fertilizer": "No additional phosphorus needed",
            "reason": f"Phosphorus at {p} mg/kg is sufficient. Excess phosphorus can lead to zinc deficiency.",
            "alternative": "Use compost to maintain organic phosphorus cycling.",
        })

    # Potassium assessment
    if k < 30:
        recommendations.append({
            "nutrient": "Potassium",
            "status": "Low",
            "fertilizer": "Muriate of Potash (MOP) (0-0-60)",
            "reason": f"Potassium is low at {k} mg/kg. MOP is the most economical source of potassium. Apply 50–80 kg/ha.",
            "alternative": "Sulphate of Potash (SOP) for chloride-sensitive crops like tobacco or grapes.",
        })
    elif k < 60:
        recommendations.append({
            "nutrient": "Potassium",
            "status": "Moderate",
            "fertilizer": "NPK Complex (10-26-26)",
            "reason": f"Potassium at {k} mg/kg is moderate. NPK complex provides balanced nutrition. Apply 50 kg/ha as basal dose.",
            "alternative": "Wood ash as an organic potassium source.",
        })
    else:
        recommendations.append({
            "nutrient": "Potassium",
            "status": "Sufficient",
            "fertilizer": "No additional potassium needed",
            "reason": f"Potassium at {k} mg/kg is sufficient for most crops. Maintain through organic matter.",
            "alternative": "Green manuring to sustain potassium levels.",
        })

    return recommendations


def compute_soil_health_index(n, p, k):
    """Compute a normalized soil health index (0-100)."""
    # Normalize each component (based on ideal ranges)
    n_score = min(n / 100, 1.0) * 100  # Ideal N: ~100 mg/kg
    p_score = min(p / 80, 1.0) * 100   # Ideal P: ~80 mg/kg
    k_score = min(k / 80, 1.0) * 100   # Ideal K: ~80 mg/kg

    health_index = (n_score + p_score + k_score) / 3
    return round(health_index, 1)


# ── API Endpoints ──────────────────────────────────────────────────

@app.route("/predict", methods=["POST"])
def predict_crop():
    """Predict the best crop based on soil parameters."""
    try:
        data = request.get_json()

        # Extract features
        n = float(data.get("N", 0))
        p = float(data.get("P", 0))
        k = float(data.get("K", 0))
        temperature = float(data.get("temperature", 25))
        humidity = float(data.get("humidity", 60))
        ph = float(data.get("ph", 6.5))

        # Prepare feature array
        features = np.array([[n, p, k, temperature, humidity, ph]])

        # Get prediction probabilities
        probabilities = model.predict_proba(features)[0]
        predicted_idx = np.argmax(probabilities)
        predicted_crop = label_encoder.inverse_transform([predicted_idx])[0]
        confidence = float(probabilities[predicted_idx])

        # Get top 3 predictions
        top_3_idx = np.argsort(probabilities)[-3:][::-1]
        top_3_crops = []
        for idx in top_3_idx:
            crop_name = label_encoder.inverse_transform([idx])[0]
            crop_conf = float(probabilities[idx])
            crop_info = CROP_INFO.get(crop_name, {})
            top_3_crops.append({
                "crop": crop_name,
                "confidence": round(crop_conf * 100, 1),
                "season": crop_info.get("season", "N/A"),
                "water_need": crop_info.get("water_need", "N/A"),
                "growth_period": crop_info.get("growth_period", "N/A"),
                "ideal_soil": crop_info.get("ideal_soil", "N/A"),
            })

        # Get fertilizer recommendations
        fertilizer_recs = get_fertilizer_recommendations(n, p, k, predicted_crop)

        # Calculate soil health index
        soil_health = compute_soil_health_index(n, p, k)

        return jsonify({
            "success": True,
            "prediction": {
                "crop": predicted_crop,
                "confidence": round(confidence * 100, 1),
                "crop_info": CROP_INFO.get(predicted_crop, {}),
            },
            "top_3_crops": top_3_crops,
            "fertilizer_recommendations": fertilizer_recs,
            "soil_health_index": soil_health,
            "input_parameters": {
                "N": n, "P": p, "K": k,
                "temperature": temperature,
                "humidity": humidity,
                "ph": ph,
            },
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/fertilizer", methods=["POST"])
def fertilizer_recommendation():
    """Get just fertilizer recommendations for given NPK and crop."""
    try:
        data = request.get_json()

        n = float(data.get("N", 0))
        p = float(data.get("P", 0))
        k = float(data.get("K", 0))
        crop = data.get("crop", "")

        recommendations = get_fertilizer_recommendations(n, p, k, crop)
        soil_health = compute_soil_health_index(n, p, k)

        return jsonify({
            "success": True,
            "fertilizer_recommendations": recommendations,
            "soil_health_index": soil_health,
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "model_loaded": True,
        "classes": list(label_encoder.classes_),
    })


if __name__ == "__main__":
    print("\nCrop & Fertilizer Recommendation API")
    print("=" * 50)
    print("Endpoints:")
    print("  POST /predict     - Crop prediction")
    print("  POST /fertilizer  - Fertilizer recommendation")
    print("  GET  /health      - Health check")
    print("=" * 50)
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
