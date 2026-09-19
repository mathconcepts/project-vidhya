---
id: inverse-trigonometric.worked-example-assured
concept_id: inverse-trigonometric
atom_type: worked_example
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
variant_of: inverse-trigonometric.worked-example
for_stance: assured
---

$\tan^{-1}(1)+\tan^{-1}(2)+\tan^{-1}(3)=\pi$ falls out of combining the first pair under the $xy>1$ correction ($\pi+\tan^{-1}(-3)=\pi-\tan^{-1}3$, since $\tan^{-1}$ is odd), then cancelling against the third term. The genuinely testable idea sitting underneath it is sharper than "check $xy$ vs $1$": the boundary $xy=1$ is not just a sign flip, it is a total breakdown of the formula's own algebra, not merely of its case split.

Take $x=1,y=1$: the true sum is $\tan^{-1}1+\tan^{-1}1=\pi/2$, a perfectly ordinary, finite value. But the formula's expression, $\dfrac{x+y}{1-xy}$, has denominator $1-1=0$ — undefined, not "large." No correction term rescues a division by zero; $\pi/2$ has to be recognised directly as the special case, never patched onto the general formula. This is exactly why the condition is stated as the strict inequality $xy<1$, never $xy\le1$: at equality, there is nothing left to correct, only a separate identity to know outright.
