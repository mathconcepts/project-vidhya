---
id: magnetic-effects.intuition-assured
concept_id: magnetic-effects
atom_type: intuition
variant_of: magnetic-effects.intuition
for_stance: assured
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

The $\sin\theta$ factor in $F=qvB\sin\theta$ is old ground. A near-identical-looking formula, torque on a current loop $\tau=NIAB\sin\theta$, uses $\theta$ for a **completely different angle** — and treating the two $\theta$'s as the same thing is a genuine, mark-costing mix-up.

For a moving charge, $\theta$ is the angle between $\vec v$ and $\vec B$ directly. For a loop, $\theta$ is the angle between the loop's **normal** (a line perpendicular to the loop's own plane, not the plane itself) and $\vec B$.

Counterexample where this bites: a $50$-turn coil, $I=2\ \text{A}$, area $A=0.01\ \text{m}^2$, sits in $B=0.4\ \text{T}$ with its **plane parallel** to $\vec B$ (so the loop's normal is perpendicular to $\vec B$, meaning $\theta=90°$ *for the loop*): $\tau=NIAB\sin90°=50\times2\times0.01\times0.4\times1=0.4\ \text{N}\cdot\text{m}$ — maximum torque. Rotate the loop so its plane is **perpendicular** to $\vec B$ instead (normal now parallel to $\vec B$, $\theta=0°$): $\tau=0$ — zero torque, even though the field and current are unchanged. A student who reads "plane parallel to the field" as if it meant $\theta=0°$ (borrowing the moving-charge picture) gets exactly the two answers swapped.

