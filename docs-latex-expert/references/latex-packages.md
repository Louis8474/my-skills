# Package Recommendations

## Always Include

| Package | Purpose |
|---------|---------|
| `amsmath` | Better math environments (`align`, `gather`, `split`) |
| `amssymb` | Additional math symbols (`\mathbb`, `\mathcal`) |
| `inputenc` | Input encoding (`\usepackage[utf8]{inputenc}`) |
| `fontenc` | Font encoding (`\usepackage[T1]{fontenc}`) |

## Font Combinations

### Times/Helvetica/Courier
```latex
\usepackage{mathptmx}          % Times for text + math
\usepackage[scaled=.90]{helvet} % Helvetica sans-serif (scaled)
\usepackage{courier}            % Courier monospace
```

| Avoid | Why |
|-------|-----|
| `times` | Obsolete, no math fonts, Helvetica unscaled |
| `pslatex` | Doesn't work with T1/TS1 encodings |
| `mathptm` | Predecessor to `mathptmx` |

### Palatino
```latex
\usepackage{mathpazo}          % Palatino for text + math
\usepackage[scaled=.95]{helvet} % Helvetica (scaled for Palatino)
\usepackage{courier}
```

| Avoid | Why |
|-------|-----|
| `palatino` | Obsolete, no math fonts |
| `mathpple` | Predecessor, wrong font metrics |

## Line Spacing

```latex
\usepackage{setspace}
\onehalfspacing    % or \doublespacing, \setstretch{1.25}
```

| Avoid | Why |
|-------|-----|
| `doublespace` | Obsolete, replaced by `setspace` |

## Headers and Footers

```latex
\usepackage{fancyhdr}
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\leftmark}
\fancyfoot[C]{\thepage}
```

| Avoid | Why |
|-------|-----|
| `fancyheadings` | Obsolete, replaced by `fancyhdr` |
| `scrpage` | Obsolete, replaced by `scrpage2` (KOMA-Script) |

## Captions

```latex
\usepackage{caption}
% Modern caption.sty (v3.x+) handles everything
```

| Avoid | Why |
|-------|-----|
| `caption2` | Old version, replaced by `caption` v3.x |

## Input Encoding

```latex
% UTF-8 (recommended for new documents)
\usepackage[utf8]{inputenc}

% Legacy encodings if needed
\usepackage[latin1]{inputenc}   % Unix, Windows
\usepackage[applemac]{inputenc} % Mac (prefer latin1 for cross-platform)
```

| Avoid | Why |
|-------|-----|
| `isolatin1`, `isolatin` | Obsolete, not universally available |
| `umlaut` | Obsolete |
| `t1enc` | Obsolete, use `fontenc` with T1 option |

## Smart Cross-References

```latex
\usepackage{cleveref}
% Then use: \cref{fig:example} → "Fig. 1"
%           \Cref{fig:example} → "Figure 1"
```

**Why**: Auto-generates correct type name (Fig., Eq., Sec.) and handles multiple references.

## Page Layout

```latex
% For custom margins (use instead of \oddsidemargin)
\usepackage{geometry}
\geometry{a4paper, margin=1in}

% Or for European typography: KOMA-Script classes
\documentclass[a4paper]{scrartcl}
```

| Avoid | Why |
|-------|-----|
| `a4`, `a4wide` | Multiple incompatible versions, poor layout |
| `\oddsidemargin` | Raw TeX, fragile |
| `\hoffset`, `\voffset` | Unless you deeply understand TeX internals |

## Greek Letters (Upright)

```latex
\usepackage{upgreek}
$\uppi$   % upright pi
$\upalpha$ % upright alpha
```

| Avoid | Why |
|-------|-----|
| `pifont` trick | Hacky workaround |
| `babel` trick | Hacky workaround |

## Graphics

```latex
\usepackage{graphicx}
\includegraphics[width=0.8\textwidth]{image.pdf}
```

| Avoid | Why |
|-------|-----|
| `epsf`, `psfig` | Obsolete, replaced by `graphicx` |
| `epsfig` | Compatibility wrapper, don't use for new docs |

## Bibliography

- Use **BibTeX** or **BibLaTeX** — never write bibliography manually
- For BibLaTeX: `\usepackage[backend=biber, style=numeric]{biblatex}`
