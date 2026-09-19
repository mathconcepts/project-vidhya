---
id: properties-of-matter.worked-example-assured
concept_id: properties-of-matter
atom_type: worked_example
variant_of: properties-of-matter.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Water flows through a horizontal pipe narrowing from $A_1=4\times10^{-4}\text{ m}^2$ to $A_2=1\times10^{-4}\text{ m}^2$; $v_1=2\text{ m/s}$, $P_1=2\times10^5\text{ Pa}$. Find $v_2$, $P_2$.

---

**Step 0 — Set up before any formula.** Horizontal pipe drops the height terms; flow steady, incompressible, non-viscous — both required for Bernoulli's equation to hold.

---

**Step 1 — Continuity, then Bernoulli, in one pass.** $v_2 = v_1(A_1/A_2) = 2(4) = 8\text{ m/s}$.

$$P_2 = P_1 + \frac12\rho(v_1^2-v_2^2) = 2\times10^5 + \frac12(1000)(4-64) = 1.7\times10^5\text{ Pa}$$

$$\boxed{v_2=8\text{ m/s},\ P_2=1.7\times10^5\text{ Pa}}$$

---

**Why this is a Venturi meter in disguise.** Measuring the pressure drop between a wide and a narrow section of a known pipe is exactly how a real Venturi meter measures flow speed — rearrange the same two equations to solve for $v_1$ from a *measured* $P_1-P_2$, and you have the instrument's working principle. The one condition silently required throughout is that no energy is lost to viscosity along the way; a genuinely viscous fluid would show a smaller pressure drop than this calculation predicts, since some of the pressure difference goes into overcoming friction with the pipe walls instead of purely speeding the fluid up.

