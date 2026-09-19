---
id: properties-of-matter.worked-example
concept_id: properties-of-matter
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Water ($\rho=1000\text{ kg/m}^3$) flows through a horizontal pipe that narrows from cross-section $A_1=4\times10^{-4}\text{ m}^2$ to $A_2=1\times10^{-4}\text{ m}^2$. At the wide section, the speed is $v_1=2\text{ m/s}$ and the pressure is $P_1=2\times10^5\text{ Pa}$. Find the speed and pressure at the narrow section.

---

**Step 0 — Set up before any formula.** Physical situation: a **horizontal** pipe (so both points sit at the same height — the $\rho gh$ term in Bernoulli's equation is identical on both sides and cancels), with **steady, incompressible, non-viscous** flow assumed (Bernoulli's principle requires all three). Frame: label the wide section "1" and the narrow section "2"; pressure and speed are both taken as positive scalar magnitudes at each labelled point.

---

**Step 1 — Find $v_2$ using the equation of continuity.** $A_1v_1=A_2v_2 \Rightarrow v_2 = \dfrac{A_1v_1}{A_2} = \dfrac{(4\times10^{-4})(2)}{1\times10^{-4}} = 8\text{ m/s}$.

---

**Step 2 — Apply Bernoulli's equation, height terms cancelling.** $P_1+\tfrac12\rho v_1^2 = P_2+\tfrac12\rho v_2^2$ (the $\rho gh$ terms drop out since the pipe is horizontal).

---

**Step 3 — Solve for $P_2$.** $P_2 = P_1 + \tfrac12\rho(v_1^2-v_2^2) = 2\times10^5 + \tfrac12(1000)(4-64) = 2\times10^5 + (500)(-60) = 2\times10^5 - 30{,}000 = 1.7\times10^5\text{ Pa}$.

---

**Step 4 — State both answers.** $\boxed{v_2=8\text{ m/s},\ P_2=1.7\times10^5\text{ Pa}}$ — the narrower section is both faster *and* lower-pressure, exactly what Bernoulli's principle predicts: speed up, and pressure must drop to keep the sum constant.

