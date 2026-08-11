---
id: ode-second-order-nonhomo.common-traps
concept_id: ode-second-order-nonhomo
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting to solve the homogeneous part first:** Students jump to finding $y_p$ without establishing $y_h$. You MUST know $y_h$ to guess the correct form for $y_p$ (especially to detect resonance). Always start with the homogeneous solution.
- **Missing resonance and not multiplying by $x$:** If the forcing term $f(x)$ is a homogeneous solution (e.g., $f(x) = e^{rx}$ and $r$ is a characteristic root), you MUST multiply your usual guess by $x$ (or higher powers for repeated roots). Forgetting this leads to an unsolvable system for the coefficients.
- **Confusing "undetermined coefficients" with "variation of parameters":** Both find $y_p$, but they're different methods. Undetermined coefficients works for simple $f(x)$ (polynomials, exponentials, trig). Variation of parameters is more general but slower. GATE exams reward speed, so use undetermined coefficients first.
