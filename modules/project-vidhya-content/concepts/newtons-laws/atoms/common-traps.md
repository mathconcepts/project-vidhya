---
id: newtons-laws.common-traps
concept_id: newtons-laws
atom_type: common_traps
bloom_level: 4
difficulty: 0.4
exam_ids: ["*"]
---

- **Choosing inconsistent positive directions for two blocks linked by the same string**: each block gets its own free-body diagram and its own positive direction — "toward the pulley" for one, "downward" for the other, say — but once chosen, the string's constraint (both blocks share the same *magnitude* of acceleration) must be applied consistently across both equations. Writing $a$ as positive in one equation and forgetting it corresponds to a different physical direction in the other equation is the single most common source of a wrong sign in a connected-bodies problem.

- **Adding a Newton's-third-law pair into the same free-body diagram**: the string's tension pulling a block, and that block's reaction pulling back on the string, act on two *different* objects. A free-body diagram for one block must include only the forces acting *on* that block — including a third-law reaction force acting on something else silently double-counts or cancels a real force.

- **Assuming tension is the same on both sides of a pulley without saying why**: for a *massless, frictionless* pulley and a *massless* string, tension is the same throughout — this is a modelling assumption, not a universal fact, and a problem giving the pulley mass or friction requires two different tensions, one on each side.

- **Using $f_s=\mu_sN$ as if static friction always equals its maximum value**: static friction adjusts to whatever value (up to $\mu_sN$) is needed to prevent sliding — for a block sitting still with no other horizontal force, static friction is *zero*, not $\mu_sN$. Only at the verge of sliding does $f_s$ actually reach $\mu_sN$.

- **Forgetting that the normal force is not always equal to $mg$**: on a horizontal surface with no vertical forces besides gravity and the surface's own push, $N=mg$ — but the moment another force has a vertical component (a push at an angle, an object on an accelerating lift), $N$ changes, and $\mu N$ must be recomputed with the *actual* $N$, not the default one.

