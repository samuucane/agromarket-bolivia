"""Tests for AgroMarket Bolivia Scoring Service"""
import pytest
from fastapi.testclient import TestClient
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app, calculate_score

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] == True

def test_calculate_score_new_user():
    features = {
        "transactions_completed": 0,
        "transactions_volume_90d": 0,
        "avg_order_value": 0,
        "days_on_platform": 1,
        "reviews_avg_rating": 0,
        "kyc_level": 0,
        "total_hectares": 0,
        "crops_diversity": 0,
        "harvest_cycles_completed": 0,
        "previous_score": 0,
        "has_organic_certification": False,
        "previous_defaults": 0,
    }
    result = calculate_score(features, 10000)
    assert 300 <= result["credit_score"] <= 850
    assert result["risk_tier"] == "VERY_HIGH"
    assert result["approval_probability"] < 0.3
    assert len(result["rejection_reasons"]) > 0

def test_calculate_score_verified_producer():
    features = {
        "transactions_completed": 15,
        "transactions_volume_90d": 25000,
        "avg_order_value": 3500,
        "days_on_platform": 180,
        "reviews_avg_rating": 4.5,
        "kyc_level": 2,
        "total_hectares": 30,
        "crops_diversity": 3,
        "harvest_cycles_completed": 4,
        "previous_score": 0,
        "has_organic_certification": False,
        "previous_defaults": 0,
    }
    result = calculate_score(features, 20000)
    assert result["credit_score"] >= 600
    assert result["risk_tier"] in ["LOW", "MEDIUM"]
    assert result["approval_probability"] >= 0.5
    assert result["rejection_reasons"] == []

def test_calculate_score_organic_premium():
    features = {
        "transactions_completed": 25,
        "transactions_volume_90d": 80000,
        "avg_order_value": 5000,
        "days_on_platform": 365,
        "reviews_avg_rating": 4.9,
        "kyc_level": 2,
        "total_hectares": 120,
        "crops_diversity": 5,
        "harvest_cycles_completed": 8,
        "previous_score": 0,
        "has_organic_certification": True,
        "previous_defaults": 0,
    }
    result = calculate_score(features, 50000)
    assert result["credit_score"] >= 720
    assert result["risk_tier"] == "LOW"
    assert result["max_credit_amount"] == 50000

def test_calculate_score_defaulter():
    features = {
        "transactions_completed": 5,
        "transactions_volume_90d": 2000,
        "avg_order_value": 400,
        "days_on_platform": 200,
        "reviews_avg_rating": 3.0,
        "kyc_level": 1,
        "total_hectares": 5,
        "crops_diversity": 1,
        "harvest_cycles_completed": 2,
        "previous_score": 0,
        "has_organic_certification": False,
        "previous_defaults": 2,
    }
    result = calculate_score(features, 10000)
    assert result["credit_score"] < 480
    assert result["risk_tier"] == "VERY_HIGH"

def test_score_clamped():
    """Score must always be between 300 and 850"""
    for _ in range(10):
        features = {k: 0 for k in [
            "transactions_completed","transactions_volume_90d","avg_order_value",
            "days_on_platform","reviews_avg_rating","kyc_level","total_hectares",
            "crops_diversity","harvest_cycles_completed","previous_score",
            "has_organic_certification","previous_defaults"
        ]}
        result = calculate_score(features, 1000)
        assert 300 <= result["credit_score"] <= 850
