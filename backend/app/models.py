from typing import Any, Literal
from pydantic import BaseModel, Field


class ProductPage(BaseModel):
    url: str
    title: str = ""
    price_text: str | None = None
    currency: str | None = None
    rating: float | None = None
    review_count: int | None = None
    brand: str | None = None
    bullets: list[str] = Field(default_factory=list)
    specifications: dict[str, Any] = Field(default_factory=dict)
    description: str | None = None
    visible_review_snippets: list[str] = Field(default_factory=list)
    seller: str | None = None
    raw_text_excerpt: str | None = None


class CriterionScore(BaseModel):
    name: str
    weight: float = Field(ge=0, le=1)
    score: float | None = Field(default=None, ge=0, le=10)
    status: Literal["good", "mixed", "poor", "unknown"]
    evidence: list[str] = Field(default_factory=list)
    explanation: str


class EvaluationResponse(BaseModel):
    category: str
    subcategory: str
    intended_use: str
    verdict: Literal["BUY", "CONSIDER", "AVOID", "INSUFFICIENT_DATA"]
    overall_score: float | None = Field(default=None, ge=0, le=10)
    confidence: int = Field(ge=0, le=100)
    summary: str
    criteria: list[CriterionScore]
    positives: list[str]
    concerns: list[str]
    missing_information: list[str]
    price_assessment: str
    research_notes: list[str]
