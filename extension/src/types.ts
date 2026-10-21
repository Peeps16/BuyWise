export type ProductPage = {
  url: string;
  title: string;
  price_text?: string;
  currency?: string;
  rating?: number;
  review_count?: number;
  brand?: string;
  bullets: string[];
  specifications: Record<string, string>;
  description?: string;
  visible_review_snippets: string[];
  seller?: string;
  raw_text_excerpt?: string;
};

export type Criterion = {
  name: string;
  weight: number;
  score: number | null;
  status: "good" | "mixed" | "poor" | "unknown";
  evidence: string[];
  explanation: string;
};

export type Evaluation = {
  category: string;
  subcategory: string;
  intended_use: string;
  verdict: "BUY" | "CONSIDER" | "AVOID" | "INSUFFICIENT_DATA";
  overall_score: number | null;
  confidence: number;
  summary: string;
  criteria: Criterion[];
  positives: string[];
  concerns: string[];
  missing_information: string[];
  price_assessment: string;
  research_notes: string[];
};
