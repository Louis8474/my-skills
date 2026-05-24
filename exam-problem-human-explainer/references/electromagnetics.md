# Electromagnetics Reference Templates

Load this file for electromagnetic field, wave, Maxwell equation, boundary condition, surface charge/current, wave impedance, or Poynting-vector exam problems.

## Main Route

For a plane-wave or field-boundary problem, use an arrow-connected route map.

```latex
主线

\[
\dot{\vec E}
=
\frac{E_m}{\sqrt2}e^{-jkz}\vec e_x
\xrightarrow{e^{-jkz}}
\vec k\parallel+\vec e_z
\xrightarrow{\vec E\times\vec H\parallel\vec k}
\dot{\vec H}\parallel\vec e_y
\xrightarrow{\nabla\times\dot{\vec E}=-j\omega\mu_0\dot{\vec H}}
\boxed{\dot{\vec H}}
\]

\[
\vec E
\xrightarrow{\vec D=\varepsilon_0\vec E,\ \rho_s=\vec n\cdot\vec D}
\boxed{\rho_s}
\qquad
\vec H
\xrightarrow{\vec J_s=\vec n\times\vec H}
\boxed{\vec J_s}
\]

\[
\text{必要说明：}\quad
\text{三条链分别面向磁场、面电荷、面电流。}
\]
```

## Magnetic Field

Use the two-line brace: governing curl equation above, known field/curl below, result boxed.

```latex
求磁场强度

\[
\left.
\begin{aligned}
&\nabla\times\dot{\vec E}
=
-j\omega\mu_0\dot{\vec H}
\xrightarrow{\text{solve for }\dot{\vec H}}
\dot{\vec H}
=
-\frac{1}{j\omega\mu_0}\nabla\times\dot{\vec E}
\\[8pt]
&\dot{\vec E}
=
\frac{E_m}{\sqrt2}e^{-jkz}\vec e_x
\xrightarrow{\nabla\times(\cdot)}
\nabla\times\dot{\vec E}
=
-jk\frac{E_m}{\sqrt2}e^{-jkz}\vec e_y
\end{aligned}
\right\}
\Longrightarrow
\boxed{
\dot{\vec H}
=
\frac{E_m}{\sqrt2}\frac{k}{\omega\mu_0}
e^{-jkz}\vec e_y
}
\]
```

## Wave-Impedance Rewrite

Attach the rewrite reason to the arrow.

```latex
\[
\dot{\vec H}
=
\frac{E_m}{\sqrt2}\frac{k}{\omega\mu}
e^{-jkz}\vec e_y
\xRightarrow[
  \text{(无耗介质) }k=\omega\sqrt{\mu\varepsilon}
]{
  \eta=\sqrt{\mu/\varepsilon}
}
\boxed{
\dot{\vec H}
=
\frac{E_m}{\sqrt2\eta}
e^{-jkz}\vec e_y
}
\]
```

## Phasor To Instantaneous

Use a conversion arrow.

```latex
\[
\dot{\vec H}
=
\frac{E_m}{\sqrt2}\frac{k}{\omega\mu_0}
e^{-jkz}\vec e_y
\xRightarrow{\Re\{\sqrt2(\cdot)e^{j\omega t}\}}
\boxed{
\vec H
=
\frac{E_mk}{\omega\mu_0}
\cos(\omega t-kz)\vec e_y
}
\]
```

## Surface Charge

Use the case-factor-first structure. First derive the shared formula containing \(\vec n\cdot\vec e_x\), then merge both plates into one `cases` block. Also state the normal convention as a short note before the shared formula when needed.

```latex
求导体板上的面电荷

\[
\text{其中 }\vec n\text{ 为从导体指向介质的单位法向量}
\]

\[
\left.
\begin{aligned}
&\rho_s=\vec n\cdot\vec D,
\qquad
\vec D=\varepsilon_0\vec E
\\[8pt]
&\vec E
=
E_m\cos(\omega t-kz)\vec e_x
\end{aligned}
\right\}
\Longrightarrow
\rho_s
=
\varepsilon_0E_m\cos(\omega t-kz)(\vec n\cdot\vec e_x)
\]

\[
\boxed{
\begin{cases}
x=0\text{ 时},\ \vec n=\vec e_x
\xrightarrow{\vec n\cdot\vec e_x=1}
\rho_s(0)=\varepsilon_0E_m\cos(\omega t-kz)
\\[6pt]
x=a\text{ 时},\ \vec n=-\vec e_x
\xrightarrow{\vec n\cdot\vec e_x=-1}
\rho_s(a)=-\varepsilon_0E_m\cos(\omega t-kz)
\end{cases}
}
\]
```

## Surface Current

Use the same case-factor-first structure.

```latex
求导体板上的面电流

\[
\text{其中 }\vec n\text{ 为从导体指向介质的单位法向量}
\]

\[
\left.
\begin{aligned}
&\vec J_s=\vec n\times\vec H
\\[8pt]
&\vec H
=
\frac{E_mk}{\omega\mu_0}
\cos(\omega t-kz)\vec e_y
\end{aligned}
\right\}
\Longrightarrow
\vec J_s
=
\frac{E_mk}{\omega\mu_0}
\cos(\omega t-kz)(\vec n\times\vec e_y)
\]

\[
\boxed{
\begin{cases}
x=0\text{ 时},\ \vec n=\vec e_x
\xrightarrow{\vec n\times\vec e_y=\vec e_z}
\vec J_s(0)=\dfrac{E_mk}{\omega\mu_0}\cos(\omega t-kz)\vec e_z
\\[6pt]
x=a\text{ 时},\ \vec n=-\vec e_x
\xrightarrow{\vec n\times\vec e_y=-\vec e_z}
\vec J_s(a)=-\dfrac{E_mk}{\omega\mu_0}\cos(\omega t-kz)\vec e_z
\end{cases}
}
\]
```

## Maxwell Equations

Use `列知识块` for law-statement questions.

```latex
\[
\text{麦克斯韦方程组}
\xrightarrow{\text{decompose}}
\text{两个散度方程}
\quad
\text{两个旋度方程}
\]
```

Then list each equation formula first, one-line meaning second.

## Necessary Notes

Include only useful notes. Examples that are often useful in EM boundary problems:

- `核心直觉`: plane-wave direction comes from phase; field directions come from \(\vec E\times\vec H\).
- `防错检查`: surface normal points from conductor into medium; opposite normals change charge/current signs.
- `需要记忆`: \(\rho_s=\vec n\cdot\vec D\), \(\vec J_s=\vec n\times\vec H\), and \(E/H=\eta\) for plane waves.

Skip this section if none of these helps the specific problem.
