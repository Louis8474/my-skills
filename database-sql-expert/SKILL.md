---
name: database-sql-expert
description: Provides expert guidance on writing clean, performant, and maintainable SQL queries. Covers performance optimization, readability improvements, and database design best practices. Use when you need to optimize SQL queries, improve query readability, or follow database design principles.
license: MIT
compatibility: Requires access to a SQL database (PostgreSQL, MySQL, SQL Server, etc.)
---

# SQL Expert Skill

This skill provides expert guidance on writing clean, performant, and maintainable SQL queries. It covers the most important best‑practice recommendations for performance, readability, and database design.

When invoked, the skill will:
- Analyze your SQL query and provide specific improvement recommendations
- Explain performance optimization techniques with examples
- Suggest readability improvements for complex queries
- Recommend database design best practices when applicable

## Key Best Practices

### Performance Optimization
See [references/sql-performance.md](references/sql-performance.md) for detailed guidance on:
- Selecting only necessary columns instead of using `SELECT *`
- Filtering data early with `WHERE` clauses
- Effective index usage and verification
- Avoiding functions on indexed columns
- Using `EXISTS` for existence checks
- Optimizing JOIN operations

### Readability and Maintainability
See [references/sql-readability.md](references/sql-readability.md) for guidance on:
- Using Common Table Expressions (CTEs) to break down complex queries
- Consistent formatting (uppercase keywords, lowercase snake_case identifiers)
- Wise commenting practices
- Using parentheses for clarity in WHERE clauses

### Database Design
See [references/sql-design.md](references/sql-design.md) for recommendations on:
- Appropriate data normalization
- Using stored procedures for frequently used logic
- Performance monitoring techniques
- Preventing SQL injection with parameterized queries

## Gotchas

- **Implicit conversions**: Comparing different data types can cause performance issues as indexes may not be used
- **NULL handling**: Remember that `NULL = NULL` is unknown, not true - use `IS NULL` instead
- **Query plan caching**: Complex queries with many parameters may not benefit from plan caching
- **Locking behavior**: Different isolation levels can cause unexpected locking and blocking
- **Aggregate functions**: `COUNT(*)` counts rows, `COUNT(column)` counts non-null values

## How to Use

When you have a SQL query that needs improvement, share it with specific context about:
- What database system you're using (PostgreSQL, MySQL, etc.)
- What performance issues you're observing (slow execution, high resource usage)
- What specific aspects you want improved (performance, readability, safety)

Example invocation:
```
How can I optimize this query for better performance?
SELECT * FROM orders WHERE YEAR(order_date) = 2023
```

The skill will respond with targeted recommendations including:
- Specific indexes to add
- Query rewrites for better performance
- Readability improvements
- Safety considerations

## Evaluation Workflow

This skill includes test prompts to verify its effectiveness:

```bash
# Run evaluation (if scripts are implemented)
python scripts/run_evaluation.py
```

Test prompts cover:
- Performance optimization scenarios
- Readability improvements  
- Database design best practices

See `evals/evals.json` for test cases.

## Output Format

When providing SQL recommendations, the skill will typically:
1. Identify issues in the current query
2. Provide an improved version
3. Explain why the changes improve performance, readability, or safety
4. Offer additional tips for similar situations

---
*Following Agent Skills specification for proper progressive disclosure and best practices*