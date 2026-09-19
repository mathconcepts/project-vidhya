---
id: inverse-trigonometric.worked-example-shaken
concept_id: inverse-trigonometric
atom_type: worked_example
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
variant_of: inverse-trigonometric.worked-example
for_stance: shaken
---

**Find $\tan^{-1}(1)+\tan^{-1}(2)+\tan^{-1}(3)$.**

Step 1. Combine the first two only: $x=1,y=2$.

Step 2. Compute $xy=1\times2=2$. Since $2>1$, the direct formula is NOT allowed.

Step 3. Use the correction: $x,y$ are both positive, so add $\pi$.

$$\tan^{-1}(1)+\tan^{-1}(2)=\pi+\tan^{-1}\!\left(\dfrac{1+2}{1-2}\right)=\pi+\tan^{-1}(-3)$$

Step 4. $\tan^{-1}(-3)=-\tan^{-1}(3)$ (odd function). So the sum so far is $\pi-\tan^{-1}(3)$.

Step 5. Add the third term, $\tan^{-1}(3)$:

$$\pi-\tan^{-1}(3)+\tan^{-1}(3)=\pi$$

**Answer**: $\pi$.

Check in degrees: $45°+63.43°+71.57°=180°$. Matches $\pi$ radians.
