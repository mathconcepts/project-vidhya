---
id: definite-integration.hook.shaken
concept_id: definite-integration
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: definite-integration.hook
for_stance: shaken
---

Look at $I=\displaystyle\int_0^{\pi/2} \frac{\sin^3x}{\sin^3x+\cos^3x}\,dx$. Do not try to integrate this fraction directly — it does not simplify that way. Instead, replace every $x$ with $\left(\frac{\pi}{2}-x\right)$: since $\sin\left(\frac{\pi}{2}-x\right)=\cos x$ and $\cos\left(\frac{\pi}{2}-x\right)=\sin x$, this gives a second expression, $\dfrac{\cos^3x}{\cos^3x+\sin^3x}$. The two fractions share the same bottom. Add them: the top becomes $\sin^3x+\cos^3x$, exactly matching the bottom. Each fraction equals $1$. So $2I=\displaystyle\int_0^{\pi/2}1\,dx=\dfrac{\pi}{2}$, giving $I=\dfrac{\pi}{4}$.
