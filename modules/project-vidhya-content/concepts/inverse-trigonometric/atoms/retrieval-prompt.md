---
id: inverse-trigonometric.retrieval-prompt
concept_id: inverse-trigonometric
atom_type: retrieval_prompt
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
---

**Recall**: For $x,y>0$ with $xy>1$, what correction must you add to $\tan^{-1}\!\left(\dfrac{x+y}{1-xy}\right)$ to get the true value of $\tan^{-1}x+\tan^{-1}y$, and why is the correction positive here specifically?

<!-- answer -->

**Answer**: Add $\pi$. Both $\tan^{-1}x$ and $\tan^{-1}y$ are positive angles (since $x,y>0$), so their true sum is a positive angle greater than $\pi/2$ — outside $\tan^{-1}$'s own range of $(-\pi/2,\pi/2)$. The raw expression lands back inside that range by subtracting $\pi$ from the true sum, so recovering the true sum means adding $\pi$ back. (For $x,y<0$, the true sum is negative and below $-\pi/2$, so the correction runs the other way: subtract $\pi$.)
