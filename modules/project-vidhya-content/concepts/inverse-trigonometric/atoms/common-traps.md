---
id: inverse-trigonometric.common-traps
concept_id: inverse-trigonometric
atom_type: common_traps
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
---

- **Applying $\tan^{-1}x+\tan^{-1}y=\tan^{-1}\!\left(\frac{x+y}{1-xy}\right)$ without checking $xy<1$**: the single most common mistake on this topic. When $xy>1$, the raw right-hand side sits a half-turn away from the true sum — you must add $\pi$ (if $x,y>0$) or subtract $\pi$ (if $x,y<0$) to the formula's own output, every time, not just when the answer "looks wrong."
- **Using the sum formula's condition on a difference, or vice versa**: the sum needs $xy<1$; the difference needs $xy>-1$. These are different numbers testing different quantities — checking the wrong one can let a broken case through undetected.
- **Writing $\sin^{-1}(\sin\theta)=\theta$ for any $\theta$**: this only holds when $\theta$ is already inside $\sin^{-1}$'s own range, $[-\pi/2,\pi/2]$. For $\theta$ outside that window, $\sin^{-1}(\sin\theta)$ returns the equivalent angle INSIDE the window, not $\theta$ itself.
- **Confusing $\tan^{-1}x$ with $(\tan x)^{-1}=\cot x$**: the "$-1$" here means inverse function, not reciprocal — an easy notational slip that changes the entire problem.
- **Forgetting $\sec^{-1}$ and $\text{cosec}^{-1}$ exclude a value from their range**: $\sec^{-1}$'s range skips $\pi/2$; $\text{cosec}^{-1}$'s range skips $0$ — because the secant and cosecant functions themselves are undefined there.
