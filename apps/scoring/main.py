"""
AgroMarket Bolivia — Credit Scoring Microservice
FastAPI + scikit-learn / XGBoost
"""

from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncpg
import os
import logging
import math

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("scoring")

# ─── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AgroMarket Bolivia — Credit Scoring API",
    description="Microservicio de scoring crediticio para productores agrícolas bolivianos",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://api:3000"],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ─── Security ────────────────────────────────────────────────────────────────
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)):
    expected_key = os.getenv("API_KEY", "dev-scoring-key")
    if api_key != expected_key:
        raise HTTPException(status_code=403, detail="API key inválida")
    return api_key

# ─── Models ──────────────────────────────────────────────────────────────────

class ScoringRequest(BaseModel):
    user_id: str
    requested_amount: float
    requested_term: int
    purpose: str

class ScoringResponse(BaseModel):
    credit_score: int                    # 300–850
    max_credit_amount: float
    recommended_term_months: int
    approval_probability: float          # 0–1
    risk_tier: str                       # LOW / MEDIUM / HIGH / VERY_HIGH
    rejection_reasons: list[str]
    features_used: dict

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str

# ─── Database ────────────────────────────────────────────────────────────────

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/agromarket")
_pool: asyncpg.Pool | None = None

async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DB_URL, min_size=2, max_size=10)
    return _pool

async def fetch_user_features(user_id: str, pool: asyncpg.Pool) -> dict:
    """Fetch all scoring features from PostgreSQL for a given user."""
    query = """
        SELECT
            -- Platform history
            (SELECT COUNT(*)::int FROM orders
             WHERE (buyer_id = u.id OR seller_id = u.id) AND status = 'COMPLETED')
             AS transactions_completed,

            (SELECT COALESCE(SUM(total),0)::float FROM orders
             WHERE (buyer_id = u.id OR seller_id = u.id)
               AND status = 'COMPLETED'
               AND created_at > NOW() - INTERVAL '90 days')
             AS transactions_volume_90d,

            (SELECT COALESCE(AVG(total),0)::float FROM orders
             WHERE (buyer_id = u.id OR seller_id = u.id) AND status = 'COMPLETED')
             AS avg_order_value,

            EXTRACT(DAY FROM NOW() - u.created_at)::int AS days_on_platform,

            (SELECT COALESCE(AVG(rating),0)::float FROM reviews
             WHERE reviewed_id = u.id) AS reviews_avg_rating,

            CASE pp.kyc_status
              WHEN 'APPROVED' THEN 2
              WHEN 'SUBMITTED' THEN 1
              ELSE 0
            END AS kyc_level,

            -- Productive profile
            COALESCE(pp.total_hectares, 0)::float AS total_hectares,

            (SELECT COUNT(DISTINCT crop_name)::int FROM producer_crops
             WHERE producer_id = pp.id) AS crops_diversity,

            (SELECT COUNT(*)::int FROM crop_cycles cc
             JOIN farms f ON cc.farm_id = f.id
             WHERE f.producer_id = pp.id AND cc.status = 'HARVESTED')
             AS harvest_cycles_completed,

            COALESCE(pp.credit_score, 0) AS previous_score,

            (SELECT EXISTS (
              SELECT 1 FROM certifications c
              WHERE c.producer_id = pp.id
                AND c.type IN ('ORGANIC','AGROECOLOGICAL')
                AND c.status = 'APPROVED'
            ))::int AS has_organic_certification,

            -- Loans
            (SELECT COUNT(*)::int FROM credit_loans cl
             JOIN credit_applications ca ON cl.application_id = ca.id
             WHERE ca.applicant_id = u.id AND cl.status = 'DEFAULTED')
             AS previous_defaults

        FROM users u
        LEFT JOIN producer_profiles pp ON pp.user_id = u.id
        WHERE u.id = $1
    """
    row = await pool.fetchrow(query, user_id)
    return dict(row) if row else {}

# ─── Scoring Logic ────────────────────────────────────────────────────────────

def calculate_score(features: dict, requested_amount: float) -> dict:
    """
    Rule-based scoring model (XGBoost model will replace this in production).
    Produces a score in the range 300–850 (FICO-inspired).
    """
    score = 400  # base score

    # ── Platform history (40% weight) ─────────────────────────────
    tx = features.get("transactions_completed", 0)
    if tx >= 20:     score += 120
    elif tx >= 10:   score += 80
    elif tx >= 5:    score += 50
    elif tx >= 1:    score += 20

    vol = features.get("transactions_volume_90d", 0)
    if vol >= 50000:  score += 40
    elif vol >= 10000: score += 20
    elif vol >= 1000: score += 10

    rating = features.get("reviews_avg_rating", 0)
    score += int(rating * 15)  # max 75 points

    days = features.get("days_on_platform", 0)
    if days >= 365: score += 30
    elif days >= 90: score += 15

    kyc = features.get("kyc_level", 0)
    score += kyc * 25  # 0, 25, or 50 points

    # ── Productive profile (35% weight) ───────────────────────────
    ha = features.get("total_hectares", 0)
    if ha >= 100:    score += 70
    elif ha >= 20:   score += 45
    elif ha >= 5:    score += 25
    elif ha >= 1:    score += 10

    crops = features.get("crops_diversity", 0)
    score += min(crops * 10, 30)  # max 30

    cycles = features.get("harvest_cycles_completed", 0)
    score += min(cycles * 15, 60)  # max 60

    if features.get("has_organic_certification"):
        score += 35

    # ── Negative factors ──────────────────────────────────────────
    defaults = features.get("previous_defaults", 0)
    score -= defaults * 80

    # ── Clamp ─────────────────────────────────────────────────────
    score = max(300, min(850, score))

    # ── Derived values ────────────────────────────────────────────
    approval_prob = (score - 300) / 550
    risk_tier = (
        "LOW" if score >= 720
        else "MEDIUM" if score >= 600
        else "HIGH" if score >= 480
        else "VERY_HIGH"
    )

    max_amounts = {"LOW": 100000, "MEDIUM": 40000, "HIGH": 12000, "VERY_HIGH": 3000}
    max_amount = min(max_amounts[risk_tier], requested_amount)

    recommended_terms = {"LOW": 18, "MEDIUM": 12, "HIGH": 6, "VERY_HIGH": 3}
    recommended_term = recommended_terms[risk_tier]

    rejection_reasons = []
    if score < 450:
        if features.get("kyc_level", 0) == 0:
            rejection_reasons.append("Identidad no verificada (KYC pendiente)")
        if features.get("transactions_completed", 0) == 0:
            rejection_reasons.append("Sin historial de transacciones en la plataforma")
        if features.get("total_hectares", 0) == 0:
            rejection_reasons.append("Sin finca registrada en Farm Manager")
        if defaults > 0:
            rejection_reasons.append(f"Historial de {defaults} crédito(s) en mora")

    return {
        "credit_score": score,
        "max_credit_amount": max_amount,
        "recommended_term_months": recommended_term,
        "approval_probability": round(approval_prob, 3),
        "risk_tier": risk_tier,
        "rejection_reasons": rejection_reasons,
        "features_used": features,
    }

# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", model_loaded=True, version="1.0.0")

@app.post("/score", response_model=ScoringResponse)
async def score_user(
    request: ScoringRequest,
    _: str = Depends(verify_api_key),
):
    logger.info(f"Scoring request: user={request.user_id}, amount={request.requested_amount}")

    try:
        pool = await get_pool()
        features = await fetch_user_features(request.user_id, pool)
    except Exception as e:
        logger.error(f"DB error fetching features: {e}")
        features = {}

    result = calculate_score(features, request.requested_amount)

    logger.info(
        f"Score result: user={request.user_id} score={result['credit_score']} "
        f"risk={result['risk_tier']} prob={result['approval_probability']}"
    )

    return ScoringResponse(**result)

@app.get("/score/{user_id}")
async def get_quick_score(user_id: str, _: str = Depends(verify_api_key)):
    """Quick score lookup for admin panels."""
    pool = await get_pool()
    features = await fetch_user_features(user_id, pool)
    result = calculate_score(features, 999999)
    return {"user_id": user_id, "credit_score": result["credit_score"], "risk_tier": result["risk_tier"]}
