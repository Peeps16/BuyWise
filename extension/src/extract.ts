import type { ProductPage } from "./types";

const text = (selector: string): string | undefined =>
  document.querySelector(selector)?.textContent?.trim() || undefined;

const texts = (selectors: string[]): string[] => {
  const out: string[] = [];
  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach((el) => {
      const value = el.textContent?.trim();
      if (value && !out.includes(value)) out.push(value);
    });
  }
  return out;
};

const parseRating = (value?: string): number | undefined => {
  const m = value?.match(/([0-5](?:\.\d+)?)/);
  return m ? Number(m[1]) : undefined;
};

const parseCount = (value?: string): number | undefined => {
  if (!value) return undefined;
  const cleaned = value.replace(/[^0-9]/g, "");
  return cleaned ? Number(cleaned) : undefined;
};

function tableSpecs(): Record<string, string> {
  const specs: Record<string, string> = {};
  document.querySelectorAll("table tr").forEach((row) => {
    const cells = row.querySelectorAll("th,td");
    if (cells.length >= 2) {
      const k = cells[0].textContent?.trim();
      const v = cells[1].textContent?.trim();
      if (k && v && k.length < 100 && v.length < 1000) specs[k] = v;
    }
  });
  return specs;
}

export function extractProduct(): ProductPage {
  // Prefer structured metadata first: it works across many stores.
  const schema = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map((el) => {
      try { return JSON.parse(el.textContent || "null"); } catch { return null; }
    })
    .flatMap((x) => Array.isArray(x) ? x : [x])
    .find((x) => x && (x["@type"] === "Product" || x["@type"]?.includes?.("Product")));

  const amazonTitle = text("#productTitle");
  const genericTitle = text('meta[property="og:title"]') || document.title;
  const title = amazonTitle || schema?.name || genericTitle || "Unknown product";

  const priceText =
    text(".a-price .a-offscreen") ||
    schema?.offers?.price?.toString() ||
    text('[itemprop="price"]');

  const ratingText = text("#acrPopover") || schema?.aggregateRating?.ratingValue?.toString();
  const reviewText = text("#acrCustomerReviewText") || schema?.aggregateRating?.reviewCount?.toString();

  const bullets = texts([
    "#feature-bullets li span.a-list-item",
    '[class*="product"] li',
    '[itemprop="description"] li'
  ]).slice(0, 20);

  const reviewSnippets = texts([
    '[data-hook="review-body"] span',
    '[itemprop="reviewBody"]'
  ]).slice(0, 12);

  const bodyExcerpt = document.body?.innerText
    ?.replace(/\s+/g, " ")
    .slice(0, 12000);

  return {
    url: location.href,
    title,
    price_text: priceText,
    currency: schema?.offers?.priceCurrency,
    rating: parseRating(ratingText),
    review_count: parseCount(reviewText),
    brand: schema?.brand?.name || schema?.brand || text("#bylineInfo"),
    bullets,
    specifications: tableSpecs(),
    description: schema?.description || text("#productDescription"),
    visible_review_snippets: reviewSnippets,
    seller: text("#sellerProfileTriggerId") || text("#merchant-info"),
    raw_text_excerpt: bodyExcerpt
  };
}
