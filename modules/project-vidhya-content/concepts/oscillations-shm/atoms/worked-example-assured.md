---
id: oscillations-shm.worked-example-assured
concept_id: oscillations-shm
atom_type: worked_example
variant_of: oscillations-shm.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Same block — but check a tempting shortcut for the speed at $x=0.05$ m first.

---

**A wrong shortcut, named up front.** $x=0.05$ m is exactly half of $A=0.1$ m, so a student might guess speed also halves: $v=v_{max}/2=1$ m/s. This is wrong, because $v=\omega\sqrt{A^2-x^2}$ is not a linear relation in $x$.

---

**The actual value.** At half-amplitude, $A^2-x^2=A^2-(A/2)^2=\frac{3}{4}A^2$, so $v=v_{max}\dfrac{\sqrt{3}}{2}=2(0.866)\approx1.73$ m/s.

$$\boxed{T\approx0.314\ \text{s},\quad v_{max}=2\ \text{m/s},\quad v(x=A/2)\approx1.73\ \text{m/s}}$$

---

**Why the shortcut fails.** $1.73$ m/s is far closer to $v_{max}=2$ m/s than to half of it — halving position drops speed by only about $13\%$, not $50\%$, because the square-root-of-a-difference-of-squares shape falls slowly near $x=0$ and only plunges sharply as $x$ approaches $A$ itself.
