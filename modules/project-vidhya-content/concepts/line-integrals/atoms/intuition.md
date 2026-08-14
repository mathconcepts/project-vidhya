---
id: line-integrals.intuition
concept_id: line-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

# Line Integrals: From Straight Paths to Curved Paths

Regular integrals $\int_a^b f(x) \, dx$ accumulate values along a straight interval on the x-axis. A **line integral** generalizes this: instead of moving left-to-right on a line, you accumulate values along a *curved path* in 2D or 3D space.

## Two Types, One Idea

**Scalar line integral** $\int_C f(x,y) \, ds$: Imagine walking along a mountain curve $C$. At each point, you measure the elevation $f(x,y)$ and multiply by the infinitesimal step $ds$. Sum up all these contributions—that's your line integral. It measures "total accumulated effect along the path."

**Vector line integral (work)** $\int_C \mathbf{F} \cdot d\mathbf{r}$: Now imagine a force field $\mathbf{F}$ (wind, gravity, current). As you walk along $C$, the force does work on you. This integral computes the *total work* = force × displacement, integrated along your actual path. Crucially: **the path matters**. A different route gives different work (unless the field is conservative).

## GATE Exam Insight

For exams, remember:
- Evaluate $\int_C (x^2 + xy) \, ds$ by parametrizing the curve $C$ first.
- For $\int_C \mathbf{F} \cdot d\mathbf{r}$, check if $\mathbf{F}$ is conservative (curl = 0). If yes, use the potential function—no path-dependency.
- Circulation around a closed curve $\oint_C \mathbf{F} \cdot d\mathbf{r}$ relates to curl via Stokes' theorem.
```

---