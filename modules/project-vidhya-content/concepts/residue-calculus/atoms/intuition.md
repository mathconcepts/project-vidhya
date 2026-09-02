---
id: residue-calculus.intuition
concept_id: residue-calculus
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: visual
---

Near a singularity $z_0$, $f$ expands as a Laurent series $f(z)=\cdots+\frac{c_{-2}}{(z-z_0)^2}+\frac{c_{-1}}{z-z_0}+c_0+c_1(z-z_0)+\cdots$. The **residue** is the single coefficient $c_{-1}$ — of the $\frac1{z-z_0}$ term, no other.

Classification by principal part: **removable** (no negative powers, e.g. $\sin z/z$ at $0$), **simple pole** (only $c_{-1}/(z-z_0)$, e.g. $1/z$), **pole of order $n$** (negative powers down to $(z-z_0)^{-n}$), **essential** (infinitely many, e.g. $e^{1/z}$).

At a simple pole: $\text{Res}_{z=z_0}f(z)=\lim_{z\to z_0}(z-z_0)f(z)$, or $p(z_0)/q'(z_0)$ when $f=p/q$ and $q'(z_0)\neq0$. At a pole of order $n$: $\text{Res}_{z=z_0}f(z)=\frac1{(n-1)!}\lim_{z\to z_0}\frac{d^{n-1}}{dz^{n-1}}\left[(z-z_0)^nf(z)\right]$.

The **Residue Theorem** collects it all: $\oint_Cf(z)\,dz=2\pi i\sum_k\text{Res}_{z=z_k}f(z)$, summed over singularities $z_k$ *inside* $C$. Applied to real integrals that resist elementary methods, $\int_{-\infty}^\infty f(x)\,dx=2\pi i\sum(\text{residues in the upper half-plane})$ — complex analysis solving a real problem.
