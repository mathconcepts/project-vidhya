---
id: trigonometric-functions.intuition-assured
concept_id: trigonometric-functions
atom_type: intuition
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
variant_of: trigonometric-functions.intuition
for_stance: assured
---

The mirror symmetries behind sine, cosine, and tangent's general solutions are not interchangeable, and mixing them up is a graded mistake, not a cosmetic one. Sine's mirror is $\sin(\pi-\theta)=\sin\theta$ — reflection about a *vertical* line — which is exactly why its formula needs the alternating $(-1)^n$: even $n$ lands on the reference angle, odd $n$ lands on its reflection. Cosine's mirror is $\cos(-\theta)=\cos\theta$ — reflection about the *horizontal* axis — needing only a plain $\pm\alpha$, no alternation at all.

Apply sine's $(-1)^n\alpha$ pattern to a cosine equation and it silently breaks: for $\cos\theta=-1/2$, the true solutions are $\theta=2n\pi\pm2\pi/3$. Try the sine-shaped formula instead, $\theta=n\pi+(-1)^n(2\pi/3)$: at $n=1$, that gives $\theta=\pi-2\pi/3=\pi/3$, and $\cos(\pi/3)=0.5$ — the wrong sign entirely. The two mirrors are genuinely different operations; borrowing one equation's shape for the other's problem does not average out, it fails outright.
