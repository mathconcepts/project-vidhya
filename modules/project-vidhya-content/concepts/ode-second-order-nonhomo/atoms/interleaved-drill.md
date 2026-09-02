---
id: ode-second-order-nonhomo.interleaved-drill
concept_id: ode-second-order-nonhomo
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: ode-second-order-homo → ode-second-order-nonhomo.**

$y''-2y'+y=e^{x}$.

**Question 1 (homogeneous-solution skill):** find the homogeneous solution first.

*Answer:* $r^2-2r+1=0\Rightarrow(r-1)^2=0\Rightarrow r=1$ (repeated). $y_h=(C_1+C_2x)e^{x}$ — a plain characteristic-equation problem, no forcing term involved yet.

**Question 2 (what the repeated root forces onto the trial):** using that homogeneous solution, what trial form does $y_p$ need for the forcing term $e^x$, and why?

*Answer:* $f(x)=e^x$ collides with $r=1$, and $r=1$ is already a *double* root — so the ordinary $x$-multiplier used for a single collision isn't enough; the trial needs $x^2$: $y_p=Ax^2e^x$. Substituting gives $y_p''-2y_p'+y_p=2Ae^x$, so $A=\tfrac12$ and $y_p=\tfrac12x^2e^x$.

**Why this drill exists:** the resonance check in this concept is only as good as the homogeneous-root skill it depends on — and a *repeated* root needs one extra power of $x$ beyond a simple root, a distinction students who rush the homogeneous step first tend to miss entirely.
