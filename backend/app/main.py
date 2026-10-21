from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .evaluator import evaluate_product
from .models import EvaluationResponse, ProductPage

app = FastAPI(title="BuyWise API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/api/evaluate", response_model=EvaluationResponse)
def evaluate(product: ProductPage):
    try:
        return evaluate_product(product)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
