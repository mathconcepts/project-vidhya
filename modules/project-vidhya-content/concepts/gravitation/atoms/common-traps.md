---
id: gravitation.common-traps
concept_id: gravitation
atom_type: common_traps
bloom_level: 4
difficulty: 0.4
exam_ids: ["*"]
---

- **Dropping the negative sign on gravitational potential energy**: $U=-GMm/r$ is always negative for a finite $r$, by the sign convention that $U=0$ only at $r=\infty$. Writing $U=+GMm/r$, or computing a "change in $U$" and forgetting which end is more negative, flips the direction of every energy argument built on it.

- **Assuming orbital speed is constant for every orbit**: $v=\sqrt{GM/r}$ gives a *constant* speed only for a **circular** orbit. In an elliptical orbit, angular momentum $L=mvr$ (perpendicular component) is conserved instead, so speed genuinely changes with distance — fastest at the closest point (perigee), slowest at the farthest (apogee). Treating an elliptical orbit's speed as fixed silently assumes it is circular when the question never said so.

- **Using $g'=g(1-d/R)$ above the surface, or $g'=g(R/(R+h))^2$ below it**: these are two different formulas for two different regions. Depth uses the linear form (only the mass inside the smaller radius pulls); height uses the inverse-square form (the full mass still pulls, just from farther away). Swapping them gives a plausible-looking but wrong number.

- **Reaching for $U=mgh$ far from the surface**: this near-surface approximation assumes $g$ stays constant over the climb. Once $h$ is comparable to $R$ (a satellite hundreds of kilometres up, not a building), the true formula $U=-GMm/r$ must be used instead — $mgh$ overestimates the true energy change in that regime.

- **Confusing escape velocity with orbital velocity**: $v_e=\sqrt{2}\,v_{orbital}$ at the same radius — escape velocity is always the larger of the two by a factor of $\sqrt{2}$, never equal to it. An object at orbital speed stays in orbit; it does not escape.

