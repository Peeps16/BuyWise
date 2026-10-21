# BuyWise — AI Product Due Diligence MVP

A generic Chrome extension that reads the product page currently open in the browser and asks an evidence-first GPT evaluator whether the item is worth buying.

## What the MVP already does

- Works as a Manifest V3 Chrome extension.
- Extracts common product facts using Schema.org `Product` JSON-LD first, plus Amazon-compatible DOM fallbacks.
- Sends structured product facts to a FastAPI backend (the OpenAI key never lives in the extension).
- Dynamically identifies the product category/subcategory.
- Dynamically decides which criteria matter for that category.
- Lets the model use web search for category-level research.
- Scores only supported attributes; missing information becomes `unknown`.
- Returns BUY / CONSIDER / AVOID / INSUFFICIENT_DATA with score + confidence + evidence gaps.

## Architecture

```text
Product page
   ↓
Chrome extension
   ↓  normalized ProductPage JSON
FastAPI backend
   ↓
GPT + web research
   ↓
Dynamic criteria + evidence-aware evaluation
   ↓
Verdict UI
```

## Run backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
# add OPENAI_API_KEY to .env
uvicorn app.main:app --reload --port 8000
```

Check `http://localhost:8000/health`.

## Build extension

```bash
cd extension
npm install
npm run build
```

Vite writes the app and copies the extension manifest to `extension/dist`. Then open `chrome://extensions`, enable Developer Mode, choose **Load unpacked**, and select `extension/dist`.

Open a product page, click BuyWise, then **Analyze this product**.

## Important MVP limitations

1. The generic extractor is intentionally conservative. It will work best on pages exposing Schema.org Product metadata and on common Amazon layouts.
2. Full market comparison / alternative-product discovery is not implemented yet. The current web research is intended primarily to establish category-quality criteria and context.
3. Review analysis only sees review snippets actually present in the page DOM; it does not crawl paginated reviews.
4. Production should add authentication, rate limits, caching, observability, retailer adapters, and stricter structured-output handling.
5. Retailer terms and policies should be reviewed before distributing a scraper-like extension broadly.

## Best next implementation step

Split extraction into retailer adapters behind a generic interface:

```text
SchemaOrgAdapter
AmazonAdapter
FlipkartAdapter
MyntraAdapter
GenericDOMAdapter
```

Then add a separate comparison agent that finds 3-5 genuinely comparable products and computes a market-relative value score.
