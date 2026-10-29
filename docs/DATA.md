# Data and analytics methodology

## Catalogue provenance

`shared/catalogue.json` retains the ten examples from the original university project: five Rolex and five Patek Philippe records. Listed prices are converted from formatted USD strings to numeric USD values; they are not new valuations or verified current market observations. Specifications remain illustrative, unverified example content.

The starting snapshot contains 10 references, an example minimum of $14,300, a maximum of $365,000, a mean of $108,130 and a median of $80,000. The page calculates these values from the current SQLite records, so edits change the statistics. The initial brand means are $40,260 for Rolex and $176,000 for Patek Philippe. Their difference describes this selected sample, not the wider market.

## Synthetic monthly series

For each original watch, seed index `i` is its zero-based position in the original catalogue and month `m` runs from 0 (January 2025) to 11 (December 2025):

```text
factor = 1 - (11 - m) × (0.004 + i × 0.0015)
         + (m == 11 ? 0 : sin(m + i) × 0.018)
example_price = round(snapshot_price × factor / 10) × 10
```

The last point equals the original sample price. The series differs by watch and is deterministic. It is generated once when seeding and is not rewritten when an administrator changes a listed price. Newly added references have no historical series; the UI states this explicitly.

These are not scraped prices, transactions, forecasts, model outputs or a backtest. No investment return, predictive accuracy or customer behaviour metric is inferred. The period is fixed, not a rolling “last 12 months”.

## SQL and calculation examples

```sql
SELECT brand, COUNT(*) AS count, AVG(price) AS average,
       MIN(price) AS min, MAX(price) AS max
FROM watches
GROUP BY brand;

SELECT style, COUNT(*) AS count
FROM watches
GROUP BY style
ORDER BY count DESC, style;
```

Median is the middle value (or the mean of the two middle values for even counts) of sorted prices. Group counts and prices are available as accessible values, and the chart’s monthly values can be expanded into a table. The CSV contains the present illustrative catalogue with a source column and USD in its price header. Formula-like string cells are prefixed before CSV quoting to reduce spreadsheet formula injection risk.

A real market analytics extension would require a licensed, documented dataset, observation timestamps, condition and currency normalisation, deduplication, coverage analysis and a defensible evaluation design. None of those are claimed for the synthetic demonstration.
