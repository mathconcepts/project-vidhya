---
id: inverse-trigonometric.worked-example
concept_id: inverse-trigonometric
atom_type: worked_example
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
---

**Find the value of $\tan^{-1}(1)+\tan^{-1}(2)+\tan^{-1}(3)$.**

Three terms cannot be combined at once — the sum formula only ever takes two inputs. Combine the first two first, and check the validity condition BEFORE applying the formula, since skipping that check is exactly how this type of question is designed to catch you.

**Step 1 — check the condition for $\tan^{-1}(1)+\tan^{-1}(2)$.** Here $x=1,y=2$, so $xy=2$. Since $xy>1$ and both $x,y$ are positive, the direct formula does NOT apply — the correction case does.

**Step 2 — apply the correction.** $\tan^{-1}x+\tan^{-1}y=\pi+\tan^{-1}\!\left(\dfrac{x+y}{1-xy}\right)$ for this case:

$$\tan^{-1}(1)+\tan^{-1}(2)=\pi+\tan^{-1}\!\left(\dfrac{1+2}{1-2}\right)=\pi+\tan^{-1}(-3)$$

Since $\tan^{-1}$ is an odd function, $\tan^{-1}(-3)=-\tan^{-1}(3)$, so this simplifies to $\pi-\tan^{-1}(3)$.

**Step 3 — add the third term.** The expression so far is $\pi-\tan^{-1}(3)+\tan^{-1}(3)$, and the last two terms cancel directly, with no further formula needed:

$$\pi-\tan^{-1}(3)+\tan^{-1}(3)=\pi$$

**Answer**: $\pi$.

**Check**: numerically, $\tan^{-1}(1)+\tan^{-1}(2)+\tan^{-1}(3)\approx45°+63.43°+71.57°=180°=\pi$ radians. Matches.
