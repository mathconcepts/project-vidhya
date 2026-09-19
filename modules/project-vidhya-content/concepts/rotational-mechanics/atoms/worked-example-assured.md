---
id: rotational-mechanics.worked-example-assured
concept_id: rotational-mechanics
atom_type: worked_example
variant_of: rotational-mechanics.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A uniform solid disc rolls without slipping down an incline through height $h=1\text{ m}$, from rest. Find its speed at the bottom. Take $g=10\text{ m/s}^2$.

---

**Step 0 — Set up before any formula.** Centre-of-mass axis (matches the given $I_{cm}=\tfrac12MR^2$); rolling without slipping, not pure rotation, so static friction does zero work at the contact point and energy is conserved.

---

**Step 1 — Use the general rolling-body shortcut.** For any rolling body, $Mgh = \tfrac12Mv^2\left(1+\dfrac{I_{cm}}{MR^2}\right)$. For a solid disc, $I_{cm}/MR^2 = \tfrac12$, so:

$$v = \sqrt{\dfrac{2gh}{1+\tfrac12}} = \sqrt{\dfrac{4gh}{3}} = \sqrt{\dfrac{40}{3}} \approx 3.65\text{ m/s}$$

$$\boxed{v \approx 3.65\text{ m/s}}$$

---

**Why the shape-factor form is faster than substituting fresh each time.** $I_{cm}/MR^2$ is a pure number fixed by shape alone — $\tfrac12$ for a disc, $\tfrac25$ for a solid sphere, $1$ for a ring — so $v=\sqrt{2gh/(1+I_{cm}/MR^2)}$ answers "which shape reaches the bottom fastest" instantly: a smaller shape-factor means a smaller denominator means a *larger* $v$. A ring ($1$) is slowest, a solid sphere ($\tfrac25$) is fastest, a solid disc sits in between — the same race outcome every single time, regardless of $M$, $R$, or $h$, since all three cancel out of the shape factor entirely.

