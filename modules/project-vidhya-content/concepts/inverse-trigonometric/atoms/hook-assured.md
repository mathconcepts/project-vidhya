---
id: inverse-trigonometric.hook-assured
concept_id: inverse-trigonometric
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: inverse-trigonometric.hook
for_stance: assured
---

$xy<1$ is not a technicality on the $\tan^{-1}x+\tan^{-1}y$ formula — it is load-bearing, and JEE tests exactly whether you check it. Whenever $xy>1$ with $x,y>0$, the raw expression $\tan^{-1}\!\left(\dfrac{x+y}{1-xy}\right)$ lands in $\tan^{-1}$'s own restricted range, $(-\pi/2,\pi/2)$, which the true sum has already walked past. At $x=1,y=2$: $xy=2>1$, raw output $\tan^{-1}(-3)\approx-72°$, but the true sum is $\approx108°$. The two differ by exactly $180°$ — add $\pi$ back, and $-72°+180°=108°$ matches. The correction is not a fudge; it is $\tan^{-1}$ reporting the same tangent value one half-turn away from where it actually sits.
