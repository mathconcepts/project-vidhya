---
# Alternative body for differentiability.intuition, served when the
# learner stance is `shaken`. Concrete-first, smallest true step,
# explicit check.
id: differentiability.intuition.shaken
concept_id: differentiability
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: differentiability.intuition
for_stance: shaken
---

Zoom in on $f(x)=|x|$ near $x=0$. However far you zoom, the left half keeps sloping down at exactly $-1$ and the right half keeps sloping up at exactly $+1$ — zooming never smooths the corner away. Compare a smooth curve like $f(x)=x^2$ near $x=0$: zoom in and the slope keeps settling closer to one single number, $0$.

Check: does $f(0)$ exist and do both sides approach it? For $|x|$, yes — $f(0)=0$, no gap. So the curve is continuous at $0$. But the slope still disagrees on the two sides. Continuous and differentiable are two separate checks, and passing the first proves nothing about the second.
