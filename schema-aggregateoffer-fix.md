# Schema Fix: AggregateOffer for Archetype Pages

## Problem

Google Search Console was reporting "no items detected" for archetype product pages (e.g., `/the-shift-knob/`). Two root causes:

1. `templates/components/products/schema.html` outputs `"@type": "Offer"` even when it emits `minPrice`/`maxPrice` (a price range). Google requires `"@type": "AggregateOffer"` for ranges — the type mismatch caused silent rejection of the entire structured data block.
2. Schema patching was split across components (`rating.js` handled `aggregateRating`), and no component was fixing the `offers` type.

## What Was Built

A new `SchemaManager` UI component (`assets/js/theme/_addons/product/ui/schemaManager.js`) consolidated all JSON-LD patching into one place.

**It patches the Product schema block once on `archetypeData` load:**
- `aggregateRating` — from `archetype_average_review` + `archetype_review_count` in archetype JSON (only if review count > 0)
- `offers` — replaced with `"@type": "AggregateOffer"` using `alias_price_low` + `alias_price_high` from archetype JSON, preserving `priceCurrency`, `availability`, and `url` from the BC-rendered schema

`rating.js` had its `_patchSchemaRating` method removed (now handled by `SchemaManager`).

## Files Changed

| File | Change |
| :--- | :--- |
| `assets/js/theme/_addons/product/ui/schemaManager.js` | **New** — all JSON-LD patching |
| `assets/js/theme/_addons/product/ui/rating.js` | Removed `_patchSchemaRating` and `schemaPatched` flag |
| `assets/js/theme/_addons/product/productController.js` | Import + initialize `SchemaManager` |

## Remaining Action (QTY Side)

Two new fields need to be added to every archetype JSON published to the Digital Ocean CDN:

```json
{
  "alias_price_low": "$29.99",
  "alias_price_high": "$89.99"
}
```

- `alias_price_low` — lowest price across all aliases for this archetype (string with `$` prefix)
- `alias_price_high` — highest price across all aliases for this archetype (string with `$` prefix)

Until these fields are live, the `offers` block falls through to whatever BigCommerce rendered (no regression — just no improvement yet).

## Verification

Once QTY fields are published:

1. Open an archetype URL in DevTools → Elements → search `application/ld+json`
   - Confirm `"@type": "AggregateOffer"` in the offers block
   - Confirm `lowPrice` / `highPrice` match the CDN values
   - Confirm `aggregateRating` is present (for archetypes with reviews)
2. Run through [Google Rich Results Test](https://search.google.com/test/rich-results) — should show a valid Product snippet with no critical errors
3. Alias URLs are unaffected (their archetype JSONs won't have price fields, so the BC-rendered offers block is left as-is)
