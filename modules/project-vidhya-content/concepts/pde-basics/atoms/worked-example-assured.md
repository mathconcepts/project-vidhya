---
# Alternative body for pde-basics-worked-example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: pde-basics.worked-example.assured
concept_id: pde-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: pde-basics-worked-example
for_stance: assured
---

## Type and boundary data decide the method, not the algebra

$A=1,B=4,C=4$ gives $\Delta=16-16=0$ — parabolic, confirmed independently since $u_{xx}+4u_{xy}+4u_{yy}=(u_x+2u_y)^2$ carries a single characteristic family.

For $u_t=u_{xx}$ on $(0,\pi)$ with $u(0,t)=u(\pi,t)=0$, $u(x,0)=\sin x$: separating gives $T'/T=X''/X=-\lambda$, and that sign is forced by the zero boundary data, not chosen by habit — $+\lambda$ would give exponential $X$, which can't vanish at both ends except trivially. $X_n=\sin(nx)$, $\lambda_n=n^2$; matching the single term $\sin x$ in the initial data isolates $n=1$:

$$\boxed{u(x,t)=e^{-t}\sin(x)}$$

The recurring slip: defaulting to $+\lambda$ without checking what the boundary conditions actually require, and only discovering the mismatch after the spatial ODE refuses to satisfy them.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: PDE classification and separation of variables","steps":[{"prompt":"For the PDE Au_xx + Bu_xy + Cu_yy = 0, you need the discriminant. Given u_xx + 4u_xy + 4u_yy = 0, identify A, B, C and compute Δ = B² − 4AC.","hint":"Read off the coefficients directly from the equation. A is the coefficient of u_xx, B of u_xy, C of u_yy.","answer":"A = 1, B = 4, C = 4. Δ = 4² − 4(1)(4) = 16 − 16 = 0. Δ = 0 means the PDE is Parabolic."},{"prompt":"For the heat equation u_t = u_xx on (0,π) with u(0,t)=u(π,t)=0 and u(x,0)=sin(x), write u = X(x)T(t) and state what eigenvalue problem X must satisfy.","hint":"Substitute into the PDE and separate variables. The ratio T'/T = X''/X must be a constant −λ. The boundary conditions on u translate directly to X(0) = X(π) = 0.","answer":"X'' + λX = 0 with X(0) = X(π) = 0. Solutions: λ_n = n², X_n = sin(nx). For the given initial condition only n = 1 survives, giving u(x,t) = e^(−t)sin(x)."}]}
```
