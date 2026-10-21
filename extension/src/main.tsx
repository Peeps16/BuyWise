import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { extractProduct } from "./extract";
import type { Evaluation, ProductPage } from "./types";
import "./styles.css";

const API = "http://localhost:8000";

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Evaluation | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error("No active tab found.");

      const injected = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const text = (s: string) => document.querySelector(s)?.textContent?.trim() || undefined;
          const texts = (ss: string[]) => {
            const out: string[] = [];
            ss.forEach((s) => document.querySelectorAll(s).forEach((el) => {
              const v = el.textContent?.trim();
              if (v && !out.includes(v)) out.push(v);
            }));
            return out;
          };
          const specs: Record<string, string> = {};
          document.querySelectorAll("table tr").forEach((row) => {
            const c = row.querySelectorAll("th,td");
            const k = c[0]?.textContent?.trim();
            const v = c[1]?.textContent?.trim();
            if (k && v && k.length < 100 && v.length < 1000) specs[k] = v;
          });
          const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
          let schema: any = null;
          for (const el of scripts) {
            try {
              const parsed = JSON.parse(el.textContent || "null");
              const arr = Array.isArray(parsed) ? parsed : [parsed];
              const p = arr.find((x: any) => x && (x["@type"] === "Product" || x["@type"]?.includes?.("Product")));
              if (p) { schema = p; break; }
            } catch {}
          }
          const ratingString = text("#acrPopover") || schema?.aggregateRating?.ratingValue?.toString();
          const reviewString = text("#acrCustomerReviewText") || schema?.aggregateRating?.reviewCount?.toString();
          const ratingMatch = ratingString?.match(/([0-5](?:\.\d+)?)/);
          const reviewDigits = reviewString?.replace(/[^0-9]/g, "");
          return {
            url: location.href,
            title: text("#productTitle") || schema?.name || document.title,
            price_text: text(".a-price .a-offscreen") || schema?.offers?.price?.toString() || text('[itemprop="price"]'),
            currency: schema?.offers?.priceCurrency,
            rating: ratingMatch ? Number(ratingMatch[1]) : undefined,
            review_count: reviewDigits ? Number(reviewDigits) : undefined,
            brand: schema?.brand?.name || schema?.brand || text("#bylineInfo"),
            bullets: texts(["#feature-bullets li span.a-list-item", '[class*="product"] li']).slice(0, 20),
            specifications: specs,
            description: schema?.description || text("#productDescription"),
            visible_review_snippets: texts(['[data-hook="review-body"] span', '[itemprop="reviewBody"]']).slice(0, 12),
            seller: text("#sellerProfileTriggerId") || text("#merchant-info"),
            raw_text_excerpt: document.body?.innerText?.replace(/\s+/g, " ").slice(0, 12000)
          } satisfies ProductPage;
        }
      });

      const product = injected[0]?.result as ProductPage | undefined;
      if (!product) throw new Error("Could not read product data from this page.");

      const response = await fetch(`${API}/api/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Evaluation failed.");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return <main>
    <header><div className="logo">B</div><div><h1>BuyWise</h1><p>AI product due diligence</p></div></header>

    {!result && <section className="hero">
      <h2>Is this actually worth buying?</h2>
      <p>We inspect the listing, research what matters for this product category, and score only what the evidence supports.</p>
      <button onClick={analyze} disabled={loading}>{loading ? "Investigating…" : "Analyze this product"}</button>
      {error && <div className="error">{error}</div>}
    </section>}

    {result && <section className="results">
      <div className={`verdict ${result.verdict.toLowerCase()}`}>
        <div><small>VERDICT</small><strong>{result.verdict.replace("_", " ")}</strong></div>
        <div className="score">{result.overall_score == null ? "—" : result.overall_score.toFixed(1)}<span>/10</span></div>
      </div>
      <p className="summary">{result.summary}</p>
      <div className="meta"><span>{result.subcategory}</span><span>{result.confidence}% confidence</span></div>

      <h3>What matters here</h3>
      {result.criteria.map((c) => <article className="criterion" key={c.name}>
        <div className="criterionTop"><strong>{c.name}</strong><span>{c.score == null ? "Unknown" : `${c.score.toFixed(1)}/10`}</span></div>
        <div className="bar"><i style={{width: `${c.score == null ? 0 : c.score * 10}%`}} /></div>
        <p>{c.explanation}</p>
      </article>)}

      {result.concerns.length > 0 && <><h3>Watch out for</h3><ul>{result.concerns.map(x => <li key={x}>{x}</li>)}</ul></>}
      {result.missing_information.length > 0 && <><h3>Missing evidence</h3><ul>{result.missing_information.map(x => <li key={x}>{x}</li>)}</ul></>}
      <div className="price"><strong>Price check</strong><p>{result.price_assessment}</p></div>
      <button className="secondary" onClick={analyze} disabled={loading}>Analyze again</button>
    </section>}
  </main>;
}

createRoot(document.getElementById("root")!).render(<App />);
