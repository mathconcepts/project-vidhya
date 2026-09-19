---
id: inverse-trigonometric.intuition-assured
concept_id: inverse-trigonometric
atom_type: intuition
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
variant_of: inverse-trigonometric.intuition
for_stance: assured
---

The sum formula's guard ($xy<1$, correcting by $\pm\pi$) and the difference formula's guard are mirror images, not the same rule copy-pasted. $\tan^{-1}x-\tan^{-1}y=\tan^{-1}\!\left(\dfrac{x-y}{1+xy}\right)$ is valid whenever $xy>-1$; it needs correcting only when $xy<-1$, which forces $x,y$ to opposite signs. Confuse the two guards — checking $xy<1$ on a DIFFERENCE — and a genuinely broken case slips through unnoticed.

Take $x=1,y=-3$: $xy=-3$, comfortably under the sum-formula's $1$, so a student checking the wrong condition sees no problem. But $xy=-3<-1$ triggers the DIFFERENCE formula's own guard: raw output is $\tan^{-1}(4/-2)=\tan^{-1}(-2)\approx-63°$, while the true difference $\tan^{-1}(1)-\tan^{-1}(-3)\approx45°+72°=117°$. Add $\pi$ (since $x>y$ here): $-63°+180°=117°$. Matches. The two guards test genuinely different quantities; treat them as one rule and this exact case fails silently.
