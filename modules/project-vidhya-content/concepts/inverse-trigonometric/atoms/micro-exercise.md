---
id: inverse-trigonometric.micro-exercise
concept_id: inverse-trigonometric
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
---

**What is $\tan^{-1}(-1)+\tan^{-1}(-2)$, in terms of $\tan^{-1}(3)$?**

(A) $\tan^{-1}(3)$
(B) $-\pi+\tan^{-1}(3)$
(C) $\pi+\tan^{-1}(3)$
(D) $-\tan^{-1}(3)$
(E) $\pi-\tan^{-1}(3)$

**Correct answer: (B).**

**Reasoning**: with $x=-1,y=-2$, $xy=2>1$ and both $x,y<0$, so the correction case applies: $\tan^{-1}x+\tan^{-1}y=-\pi+\tan^{-1}\!\left(\dfrac{x+y}{1-xy}\right)$. Here $\dfrac{x+y}{1-xy}=\dfrac{-3}{1-2}=\dfrac{-3}{-1}=3$, so the expression is $-\pi+\tan^{-1}(3)$, matching (B).

Numerically: $\tan^{-1}(-1)+\tan^{-1}(-2)\approx-45°-63.43°=-108.43°$, and $-\pi+\tan^{-1}(3)$ in degrees is $-180°+71.57°=-108.43°$. Matches.

Option (E) is the sign-flipped trap a student gets from correcting with $+\pi$ instead of $-\pi$ — checking the sign of $x,y$ before choosing the correction, not just checking $xy>1$, is what this question is really testing.
