# Performance and Optimization

- **Select only necessary columns** – avoid `SELECT *` in production to reduce network traffic, memory usage, and I/O load.
- **Filter data early** – use `WHERE` clauses before `GROUP BY` or joins to shrink the data set as soon as possible.
- **Use indexes effectively** – create indexes on columns frequently used in `WHERE`, `JOIN`, and `ORDER BY`. Verify with execution plans that indexes are being used.
- **Avoid functions on indexed columns** – applying functions prevents index usage. Prefer range predicates, e.g. `WHERE date_column >= '2024-01-01' AND date_column < '2025-01-01'`.
- **Prefer `EXISTS` over `COUNT()` or `IN`** when checking for existence; `EXISTS` stops scanning after the first match.
- **Use `UNION ALL` instead of `UNION`** when duplicate rows are not a concern – `UNION` incurs an extra sort step.
- **Optimize JOIN operations** – specify join type (`INNER`, `LEFT`) explicitly, ensure join keys are indexed, and avoid unnecessary joins.
