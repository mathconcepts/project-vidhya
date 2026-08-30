---
# Alternative body for pde-basics-worked-example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: pde-basics.worked-example.shaken
concept_id: pde-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: pde-basics-worked-example
for_stance: shaken
---

## Part A: classify $u_{xx}+4u_{xy}+4u_{yy}=0$

**Classify.** $A=1$, $B=4$, $C=4$, so $\Delta=B^2-4AC=16-16=0$.

**Result.** $\Delta=0$: parabolic.

## Part B: solve $u_t=u_{xx}$ on $(0,\pi)$, $u(0,t)=u(\pi,t)=0$, $u(x,0)=\sin x$

**Classify.** Assume $u=X(x)T(t)$. Substituting and dividing by $XT$ gives $\dfrac{T'}{T}=\dfrac{X''}{X}=-\lambda$.

**Solve.** $X''+\lambda X=0$ with $X(0)=X(\pi)=0$ forces $\lambda_n=n^2$, $X_n=\sin(nx)$; then $T_n'=-n^2T_n$ gives $T_n=e^{-n^2t}$. Matching $u(x,0)=\sin x$ against $\sum b_n\sin(nx)$ picks $b_1=1$, every other $b_n=0$:

$$\boxed{u(x,t)=e^{-t}\sin(x)}$$

**Check.** $u_t=-e^{-t}\sin x$ and $u_{xx}=-e^{-t}\sin x$: equal, so $u_t=u_{xx}$ holds. At $t=0$: $u=\sin x$. At $x=0$ and $x=\pi$: $u=0$. All three conditions confirmed.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: PDE classification and separation of variables","steps":[{"prompt":"For the PDE Au_xx + Bu_xy + Cu_yy = 0, you need the discriminant. Given u_xx + 4u_xy + 4u_yy = 0, identify A, B, C and compute Δ = B² − 4AC.","hint":"Read off the coefficients directly from the equation. A is the coefficient of u_xx, B of u_xy, C of u_yy.","answer":"A = 1, B = 4, C = 4. Δ = 4² − 4(1)(4) = 16 − 16 = 0. Δ = 0 means the PDE is Parabolic."},{"prompt":"For the heat equation u_t = u_xx on (0,π) with u(0,t)=u(π,t)=0 and u(x,0)=sin(x), write u = X(x)T(t) and state what eigenvalue problem X must satisfy.","hint":"Substitute into the PDE and separate variables. The ratio T'/T = X''/X must be a constant −λ. The boundary conditions on u translate directly to X(0) = X(π) = 0.","answer":"X'' + λX = 0 with X(0) = X(π) = 0. Solutions: λ_n = n², X_n = sin(nx). For the given initial condition only n = 1 survives, giving u(x,t) = e^(−t)sin(x)."}]}
```

Both parts reduce to the same move: name the coefficients, then read the type or the eigenvalues straight off them.
