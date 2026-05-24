# Math Typesetting Best Practices

## Equation Environments

| Avoid | Use Instead |
|-------|-------------|
| `eqnarray` | `align` (from `amsmath`) |
| `eqnarray*` | `align*` (from `amsmath`) |
| `displaymath` (with `amsmath`) | `\[...\]` |

**Why**: `eqnarray` has inconsistent spacing and can overwrite equation numbers. `align` handles spacing correctly and supports multiple alignments with `&`.

```latex
% Bad
\begin{eqnarray}
  a &=& b \\
  c &=& d
\end{eqnarray}

% Good
\begin{align}
  a &= b \\
  c &= d
\end{align}
```

## Referencing Equations

| Avoid | Use Instead |
|-------|-------------|
| `(\ref{eq:foo})` | `\eqref{eq:foo}` |
| Ref. `\cite{bar}` | Ref.~`\cite{bar}` (protected space) |

**Why**: `\eqref` automatically adds correctly sized parentheses. The tilde prevents awkward line breaks between a word and its reference.

## Text in Math Mode

| Avoid | Use Instead |
|-------|-------------|
| `$H_{effective}$` | `$H_{\text{effective}}$` |
| `$H_{\mbox{eff}}$` | `$H_{\text{eff}}$` |

**Why**: Underscores in subscripts render as math variables, breaking ligatures. `\text{}` uses the correct text font and size. `\mbox` ignores font size changes.

## Parentheses and Sizing

| Avoid | Use Instead |
|-------|-------------|
| `( \frac{a}{b} )` | `\left( \frac{a}{b} \right)` |
| — | `\bigl(`, `\bigr)` (manual sizing) |
| — | `\Bigl(`, `\Bigr)` |
| — | `\biggl(`, `\biggr)` |
| — | `\Biggl(`, `\Biggr)` |

**Why**: Standard parentheses don't scale with content. `\left`/`\right` auto-size; manual sizing (`\big` etc.) gives finer control.

## Proper Symbols and Operators

| Avoid | Use Instead |
|-------|-------------|
| `:=` | `\coloneqq` (requires `mathtools`) |
| `:` in formulas | `\colon` |
| `...` | `\dots` |
| `sin()`, `cos()` | `\sin()`, `\cos()` (proper spacing) |
| `\mathbb{R}` repeated | `\newcommand{\reals}{\mathbb{R}}` |

**Why**: `\dots` adapts spacing contextually. `\sin` adds proper operator spacing. Defining semantic commands improves readability and consistency.

## Units

| Avoid | Use Instead |
|-------|-------------|
| `$kg$` in text | `\unit{kg}` (with `siunitx`) |
| `$v = 5$ m/s` | `\qty{5}{m/s}` (with `siunitx`) |
| Manual formatting | `\num{1.2e-3}` (with `siunitx`) |

**Why**: `siunitx` ensures consistent unit formatting, correct spacing, and proper typography. Variables use math style, units use text style.

```latex
\usepackage{siunitx}

The velocity is \qty{3e8}{m/s}.
The mass is \qty{9.1e-31}{\kilogram}.
```

## Quantum Mechanics / Physics Notation

The `physics` package provides semantic commands:

```latex
\usepackage{physics}

\bra{\psi}          % ⟨ψ|
\ket{\psi}          % |ψ⟩
\braket{\phi}{\psi} % ⟨φ|ψ⟩
\mqty{a \\ b}      % vector (a, b)
```

**Why**: `\bra{}` and `\ket{}` are more readable than `\langle`/`\rangle`. Never use `<` and `>` for Dirac notation.

## Label Conventions for Math

- Equations: `\label{eq:schrodinger}`
- Always use `\eqref{eq:schrodinger}` to reference them
- With `cleveref`: `\cref{eq:schrodinger}` auto-generates "Eq. (1)"
