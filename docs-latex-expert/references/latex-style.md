# Source Code Style & Conventions

## File Structure

- **One sentence per line** — enables meaningful `diff` and easy merging in version control
- LaTeX ignores single line breaks; only blank lines create paragraphs

```
The quick brown fox jumps over the lazy dog.
This is the next sentence on its own line.
```

Not:
```
The quick brown fox jumps over the lazy dog. This is the next
sentence that wraps in the editor but renders as one paragraph.
```

## Labels

Prefix all labels by type:

| Type | Prefix | Example |
|------|--------|---------|
| Equation | `eq:` | `\label{eq:schrodinger}` |
| Figure | `fig:` | `\label{fig:experiment-setup}` |
| Table | `tab:` | `\label{tab:results}` |
| Section | `sec:` | `\label{sec:introduction}` |
| Chapter | `ch:` | `\label{ch:methods}` |
| Appendix | `app:` | `\label{app:derivations}` |

**Why**: Makes it immediately clear what you're referencing. Also prevents name collisions between different element types.

## Cross-References

```latex
As shown in Eq.~\eqref{eq:energy}, the result is...
Figure~\ref{fig:setup} illustrates the apparatus.
Section~\ref{sec:methods} describes the procedure.
```

- Use `~` (protected space) before `\ref`, `\eqref`, `\cite` to prevent line breaks
- With `cleveref`: `\cref{eq:energy,fig:setup}` auto-generates "Eq. (1) and Fig. 2"

## Semantic Commands

Define commands for repeated symbols or notation:

```latex
% Good: semantic, readable, maintainable
\newcommand{\reals}{\mathbb{R}}
\newcommand{\dgr}{^\dagger}
\newcommand{\expect}[1]{\left\langle #1 \right\rangle}

% Usage
Let $x \in \reals$. The adjoint is $A\dgr$.
```

- Use `\ensuremath{}` if a command should work in both text and math mode
- Define commands in the preamble, not scattered throughout the document

## Environments

### Equations
```latex
% Single equation
\begin{equation}\label{eq:energy}
  E = mc^2
\end{equation}

% Multiple aligned equations
\begin{align}
  a &= b + c  \label{eq:first} \\
  d &= e + f  \label{eq:second}
\end{align}

% Unnumbered
\begin{equation*}
  E = mc^2
\end{equation*}
```

### Figures
```latex
\begin{figure}[htbp]
  \centering
  \includegraphics[width=0.8\textwidth]{image.pdf}
  \caption{Description of the figure.}
  \label{fig:example}
\end{figure}
```

- Use `\centering` inside floats, not `\begin{center}` (extra vertical space)
- Prefer `htbp` placement specifier

### Tables
```latex
\begin{table}[htbp]
  \centering
  \caption{Results summary.}
  \label{tab:results}
  \begin{tabular}{lrr}
    \toprule
    Item & Value & Error \\
    \midrule
    A & 1.23 & 0.01 \\
    B & 4.56 & 0.02 \\
    \bottomrule
  \end{tabular}
\end{table}
```

- Use `booktabs` package for `\toprule`, `\midrule`, `\bottomrule` (no vertical lines)

## Preamble Organization

```latex
\documentclass[11pt, a4paper]{article}

% Encoding
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}

% Math
\usepackage{amsmath, amssymb}

% Graphics
\usepackage{graphicx}

% References
\usepackage{cleveref}

% Units
\usepackage{siunitx}

% Custom commands
\newcommand{\reals}{\mathbb{R}}

\begin{document}
```

## Appendix

The `\appendix` is a command, not an environment:

```latex
% Correct
\appendix
\section{Derivation Details}

% Wrong
\begin{appendix}
\section{Derivation Details}
\end{appendix}
```
