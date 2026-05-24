---
name: exam-problem-human-explainer
description: Use when explaining exam problems, textbook exercises, worked solutions, or engineering problems where the user wants a concise, arrow-connected flowchart and formula-chain answer that is easy to scan.
---

# Exam Problem Human Explainer

## Core Rule

Produce a concise reference solution, not a lecture transcript.

The answer is a connected formula flowchart. It is not a prose derivation with equations placed between words.

**Main line must be a flowchart.** In `主线`, every node must be connected by an arrow. The arrow label carries the theorem, formula, definition, condition, or conversion rule. Put the derived intermediate formula or target on the right side of the arrow. Continue the arrow chain until the requested conclusion is reached.

After `主线`, every derivation must follow the diagram structures in the templates below: brace convergence, annotated arrow chain, boxed conclusion, or case-factor substitution. **Every non-main-line derivation must use only these shapes.** Do not write scattered equations separated by labels such as "given / phasor form / and / therefore / instantaneous form".

Assume the user is comfortable with routine calculus, algebra, cross products, transforms, phasor conversion, and symbolic manipulation. Omit routine mechanics unless asked.

## Hard Structure Contract

Use these rules as hard constraints:

- `主线` is a flowchart, never a paragraph or a vertical list.
- Every arrow must be labeled with the basis: formula, theorem, definition, known condition, algebraic rewrite, or target-form conversion.
- Box only scoring-point formulas: use `\boxed{...}` only for core formulas, exam scoring points, final requested answers, and indispensable intermediate conclusions. Do not box ordinary given quantities, routine substitutions, direction readouts, or every node in a flowchart.
- Forbidden prose connectors: `由...得...`, `因为...所以...`, `又因为...所以...`, `可得`, `得到`, `推出`, `故`, `于是`, and isolated `而` used as a derivation step.
- Replace any forbidden connector with an arrow:

```latex
\[
\text{known/current form}
\xrightarrow{\text{basis/formula}}
\boxed{\text{derived scoring-point form or final target}}
\]
```

- If two or more inputs converge, use a right brace and `\Longrightarrow`.
- If a result is rewritten, use `\xrightarrow{\cdots}`, `\xRightarrow{\cdots}`, or `\xRightarrow[\cdots]{\cdots}`.
- Put assumptions in parentheses on the arrow label, e.g. `\xRightarrow{\text{(无耗介质) }k=\omega\sqrt{\mu\varepsilon}}`.
- If the problem has cases, first build one shared formula with a case factor, then merge simple substitutions into one `cases` block. Case lines should be merged into one cases block unless each case needs a genuinely different derivation.
- Put only necessary explanation below the flowchart. Explanation may name the route, check signs/units, or state intuition; it must not continue the derivation in prose.

## Workflow

Use this pipeline:

```text
主线流程图 -> 对应模块 -> 括号合流/箭头链 -> 分情况代入 -> 必要说明
```

Each section after `主线` must do one job. Each later module must correspond to a route chain announced in `主线`.

## Subject References

Load only the relevant reference file when the problem matches it:

- Electromagnetic field, Maxwell equation, plane wave, wave impedance, boundary condition, surface charge/current, or Poynting-vector problems: read `references/electromagnetics.md`.

If no reference file matches, use the core templates below.

## Module Interfaces

| Module | Job | Required Output Shape |
| --- | --- | --- |
| `主线` | Lock the route before derivation | arrow-connected flowchart, followed by brief necessary notes |
| `求目标量` | Compute one target only | right brace: governing relation + known expression, then boxed scoring-point result |
| `关系改写` | Rewrite by identities, constitutive relations, units, definitions, or equivalent forms | annotated arrow chain or brace-merged relation map |
| `转题目形式` | Convert phasor/domain/sign/unit/vector form | annotated arrow into boxed requested form |
| `分情况` | Apply normals, regions, branches, limits, or cases | shared case-factor formula, then one cases block |
| `列知识块` | State laws, definitions, theorem lists, or conceptual blocks | formula map, then formula-first one-line meanings |
| `必要说明` | Explain only useful intuition, checks, or memory hooks | 0-4 short sentences after diagrams only |

## Core Templates

### 1. `主线`

The main line is a graphical flowchart. It must show the whole route with arrows.

```latex
主线

\[
\text{题设/已知量}
\xrightarrow{\text{判定条件/定义}}
\text{中间量 1}
\xrightarrow{\text{定理/公式}}
\text{中间量 2}
\xrightarrow{\text{题目要求形式}}
\boxed{\text{最终目标}}
\]

\[
\text{必要说明：}\quad
\text{only one short route note if it helps scanning.}
\]
```

For two inputs that merge into one conclusion:

```latex
\[
\left.
\begin{aligned}
&\text{input A}
\xrightarrow{\text{basis A}}
\text{intermediate A}
\\[8pt]
&\text{input B}
\xrightarrow{\text{basis B}}
\text{intermediate B}
\end{aligned}
\right\}
\xrightarrow{\text{merge relation}}
\boxed{\text{target conclusion}}
\]
```

For multiple targets:

```latex
\[
\text{known}
\xrightarrow{\text{formula for target 1}}
\boxed{\text{target 1}}
\qquad
\text{known}
\xrightarrow{\text{formula for target 2}}
\boxed{\text{target 2}}
\]
```

Do not use `给定：`, `直接读出：`, `所以：`, or sentence-style route summaries in the main line. Put any short note under the flowchart.

### 2. `求目标量`

Use when deriving one unknown from one governing relationship plus one known expression.

```latex
求目标量

\[
\left.
\begin{aligned}
&\text{控制方程/定理/判据}
\xrightarrow{\text{整理为目标量}}
\text{目标量的表达式}
\\[8pt]
&\text{已知表达式/读图量/条件}
\xrightarrow{\text{代入或算符作用}}
\text{所需中间量}
\end{aligned}
\right\}
\Longrightarrow
\boxed{\text{目标量}=\text{结果}}
\]
```

The two lines inside the brace must be enough to explain the result. Do not insert prose between them.

### 3. `关系改写`

Use when a result is rewritten by an identity, definition, unit conversion, constitutive relation, or equivalent form.

```latex
\[
\text{current form}
\xRightarrow[
  \text{supporting relation}
]{
  \text{main rewrite relation}
}
\boxed{\text{rewritten form}}
\]
```

For a longer chain, keep every reason on an arrow:

```latex
\[
\text{current form}
\xrightarrow{\text{basis 1}}
\text{derived form 1}
\xrightarrow{\text{basis 2}}
\boxed{\text{final rewritten form}}
\]
```

When a relation is valid only under an assumption, put the assumption in parentheses on the arrow:

```latex
\[
\frac{k}{\omega\mu}
\xRightarrow{\text{(无耗介质) }k=\omega\sqrt{\mu\varepsilon}}
\boxed{\frac{1}{\eta}}
\]
```

### 4. `转题目形式`

Use when a phasor, transform-domain, vector, sign convention, or intermediate result must be converted to the requested form.

```latex
\[
\text{intermediate form}
\xRightarrow{\text{conversion rule}}
\boxed{\text{requested form}}
\]
```

Examples of arrow labels: `\Re\{(\cdot)e^{j\omega t}\}`, `s=j\omega`, `\eta=\sqrt{\mu/\varepsilon}`, `\vec D=\varepsilon\vec E`.

### 5. `分情况`

Use when a general formula must be evaluated on boundaries, regions, branches, cases, or surfaces. The case-factor structure is mandatory. For simple sign or normal substitutions, put all case results in one `cases` block.

```latex
\[
\left.
\begin{aligned}
&\text{governing relation involving the case quantity}
\\[6pt]
&\text{shared expression}
\end{aligned}
\right\}
\Longrightarrow
\text{general result}
=
\text{coefficient}\cdot(\text{case factor})
\]

\[
\boxed{
\begin{cases}
\text{case label 1},\ \text{case factor}_1
\xrightarrow{\text{substitute}}
\text{case result}_1
\\[6pt]
\text{case label 2},\ \text{case factor}_2
\xrightarrow{\text{substitute}}
\text{case result}_2
\end{cases}
}
\]
```

Do not separately derive every case. The shared formula must appear first. Do not box each line separately when one `cases` block is cleaner.

### 6. `列知识块`

Use for definitions, laws, theorem statements, or conceptual lists.

```latex
\[
\text{knowledge block}
\xrightarrow{\text{decompose}}
\text{part 1}
\quad
\text{part 2}
\quad
\text{part 3}
\]
```

Then give each item as formula first, one-line meaning second. Do not turn the list into a lecture.

## Layout Rules

- Prefer displayed equations over inline math for derivations.
- Use `\boxed{...}` only for final requested results, core scoring formulas, and indispensable intermediate conclusions. Sparse boxing is mandatory.
- Put rewrite reasons above/below the arrow with `\xrightarrow{\cdots}`, `\xRightarrow{\cdots}`, or `\xRightarrow[\cdots]{\cdots}`.
- Put assumptions in parentheses inside the arrow label: `\xRightarrow{\text{(assumption) formula}}`.
- Use `\left.\begin{aligned}...\end{aligned}\right\}` for converging relations.
- A conclusion must appear either on the right side of an arrow or after a brace `\Longrightarrow`.
- Merge simple case substitutions with `\begin{cases}...\end{cases}` instead of repeating separate displayed equations.
- Do not use bullets inside mathematical derivations unless the problem is purely conceptual.
- Avoid large blank gaps between equations; the visual route should be compact and continuous.

## Useful Divergence

Add `补充做法` or mention an alternate view in `必要说明` only when it satisfies at least one gate:

- It is a common standard method for this problem type.
- It is shorter than the main route.
- It provides an independent check on signs, direction, units, stability, causality, or region.
- It explains why the chosen route is natural.
- It gives reusable intuition for future problems.

Reject obscure methods, long alternatives, tangential facts, or comments added only to satisfy a template.

## 必要说明

Use `必要说明` conditionally. Include it only when there is a genuine intuition, memorized relation, sign/direction/unit check, common alternate method, or transferable conclusion. If none exists, omit the section.

When included, choose only the relevant items:

- `核心直觉`: physical/geometric/system intuition behind the route.
- `防错检查`: sign, direction, unit, region of convergence, boundary orientation, stability, or causality checks.
- `需要记忆`: compact laws, boundary conditions, transform pairs, or decision rules worth memorizing.
- `补充做法`: a common shorter method or independent check.

These notes are not derivation steps. If a note contains a formula consequence, rewrite that consequence as an arrow diagram before the note.

## Common Mistakes

- Making `主线` a vertical "given / readout / therefore" list instead of a flowchart.
- Boxing every equation or every flowchart node instead of only scoring-point formulas.
- Writing an assumption as a prose sentence instead of putting it in parentheses above the arrow.
- Splitting simple boundary sign substitutions into separate paragraphs instead of one `cases` block.
- Writing scattered equations separated by derivation words, like the old solution style in image 1.
- Letting later sections introduce targets not announced in `主线`.
- Replacing formula relationship diagrams with lecture-style prose.
- Using a banned connector instead of an annotated arrow or brace merge.
- Splitting boundary/case work into repeated blocks before deriving the shared case-factor formula.
- Listing positions, material statements, and normals as loose prose instead of feeding them into one general formula.
- Adding alternative methods or `必要说明` content that is correct but not useful.

## Self-Check Before Answering

Before finalizing an exam solution, check:

- Does `主线` start with an arrow-connected flowchart?
- Does every arrow show its basis above or below the arrow?
- Are assumptions parenthesized in arrow labels?
- Are all later derivations brace convergence, arrow chains, boxed results, or case-factor substitutions?
- Are only core/scoring/final formulas boxed?
- Are simple cases merged into one `cases` block?
- Are all forbidden prose connectors absent from derivation text?
- Is any explanation placed below the diagram and kept non-derivational?

## Example Policy

Keep examples short and skeletal in this file. Put subject-specific examples in `references/` and load only the relevant reference file.
