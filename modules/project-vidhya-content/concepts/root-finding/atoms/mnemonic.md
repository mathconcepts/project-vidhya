---
id: root-finding.mnemonic
concept_id: root-finding
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**Newton's ski slope.** Picture standing on the curve at $x_n$, then skiing straight down the *tangent line* until it hits the x-axis — that landing spot is $x_{n+1}$. You never ski along the curve itself, only along its tangent, which is exactly why $f'(x_n)$ must be nonzero: a flat slope never reaches the ground.

**Worked check:** find $\sqrt2$ as a root of $f(x)=x^2-2$, starting at $x_0=1.5$. $f(1.5)=0.25$, $f'(1.5)=3$. $x_1=1.5-\frac{0.25}{3}=1.41667$, already matching $\sqrt2\approx1.41421$ to three decimals after one ski run.

**Sanity-check reflex:** before trusting any Newton-Raphson answer, check the slope you skied down wasn't near flat — if $f'(x_n)$ is small, the "ski slope" is nearly horizontal and the landing spot can fly off far from the true root.
