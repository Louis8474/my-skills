# Obsolete vs Modern Commands

## Font Style

| Obsolete | Modern (argument) | Modern (switch) |
|----------|-------------------|-----------------|
| `{\bf ...}` | `\textbf{...}` | `\bfseries` |
| `{\it ...}` | `\textit{...}` | `\itshape` |
| `{\rm ...}` | `\textrm{...}` | `\rmfamily` |
| `{\sf ...}` | `\textsf{...}` | `\sffamily` |
| `{\tt ...}` | `\texttt{...}` | `\ttfamily` |
| `{\sc ...}` | `\textsc{...}` | `\scshape` |
| `{\sl ...}` | `\textsl{...}` | `\slshape` |
| — | `\emph{...}` | `\em` |
| — | `\textup{...}` | `\upshape` |
| — | `\textmd{...}` | `\mdseries` |

**Why**: Old commands reset all font attributes. `{\it {\bf x}}` produces only bold, not bold-italic. Modern commands compose correctly: `\textbf{\textit{x}}` → **_x_**. Also, italic correction is lost with old commands (e.g., `{\it half}hearted` vs `\textit{half}hearted`).

## Math Mode Delimiters

| Obsolete | Modern |
|----------|--------|
| `$$...$$` | `\[...\]` |
| — | `\begin{displaymath}...\end{displaymath}` |

**Why**: `$$...$$` is Plain TeX. It produces inconsistent vertical spacing and breaks the `fleqn` class option.

## Macro Definitions

| Obsolete | Modern |
|----------|--------|
| `\def\name{...}` | `\newcommand{\name}{...}` |
| — | `\renewcommand{\name}{...}` |

**Why**: `\def` silently overwrites existing macros without error. `\newcommand` checks for conflicts and raises an error if the name already exists.

## Math Fractions

| Obsolete | Modern |
|----------|--------|
| `a \over b` | `\frac{a}{b}` |

**Why**: `\over` is Plain TeX with different syntax that breaks with `amsmath`. `\frac{}{}` is standard LaTeX and easier to read/write.

## Centering

| Obsolete | Modern |
|----------|--------|
| `\centerline{...}` | `{\centering ...}` |
| — | `\begin{center}...\end{center}` |

**Why**: `\centerline` is Plain TeX. It's incompatible with packages like `color.sty` and produces unexpected results in lists.

## Paragraph Spacing

| Obsolete | Modern |
|----------|--------|
| `\parindent=1em` | `\setlength{\parindent}{1em}` |
| `\baselinestretch` | `\linespread{factor}` or `setspace` package |
| `\setlength{\parskip}{\baselineskip}` | `parskip` package or KOMA-Script options |

**Why**: Use LaTeX commands, not raw TeX assignments. `\parskip` affects lists and TOC; `parskip.sty` handles side effects properly.

## Line Breaking

| Obsolete/Problematic | Modern |
|---------------------|--------|
| `\sloppy` | Reword text, or use: |
| — | `\tolerance 1414` |
| — | `\emergencystretch 1.5em` |
| — | `sloppypar` environment (last resort) |

**Why**: `\sloppy` globally produces loose, ugly justified text. Try rewording or tuning specific parameters first.
