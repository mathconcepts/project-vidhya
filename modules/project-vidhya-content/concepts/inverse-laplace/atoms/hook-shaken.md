---
# Alternative body for inverse-laplace.hook, served when the learner stance
# is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: inverse-laplace.hook.shaken
concept_id: inverse-laplace
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: inverse-laplace.hook
for_stance: shaken
---

Take $F(s)=\dfrac{1}{s+3}$. Match its shape to the table entry $\dfrac{1}{s+a}\to e^{-at}$ with $a=3$:

$$f(t)=e^{-3t}$$

No partial fractions were even needed — the whole job here was matching the shape.

```interactive-spec
{"v": 1, "kind": "simulation", "why": "Poles with zero real part carry no decay at all — tracing $\\tfrac12\\sin2t$ shows an oscillation keeping its exact amplitude forever, exactly what an imaginary pole promises before any table lookup.", "title": "$F(s)=\\dfrac{1}{s^2+4}$ inverting to a pure oscillation", "x_expr": "t", "y_expr": "0.5*sin(2*t)", "t_min": 0, "t_max": 3.14159265, "duration_sec": 8, "narration_steps": [{"at_progress": 0.0, "text": "$F(s)=\\dfrac{1}{s^2+4}$ has only imaginary poles, at $s=\\pm2j$ — no real part at all. Predict: does $f(t)$ decay toward $0$, or keep oscillating at the same amplitude forever?"}, {"at_progress": 0.25, "text": "$f(t)=\\tfrac12\\sin2t$ reaches its peak at $(t,f)=(\\pi/4,\\,0.5)$ — oscillating, never shrinking, exactly what an imaginary pole predicts.", "emphasize": true, "focus_point": true}, {"at_progress": 0.5, "text": "Back through zero at $t=\\pi/2$ — the curve crosses the axis, but the next swing's peak height will be the same $0.5$, not smaller.", "focus_point": true}, {"at_progress": 0.75, "text": "Students expect the leading $1$ in $F(s)=\\dfrac{1}{s^2+4}$ to mean amplitude $1$, missing that it must be rewritten as $\\tfrac12\\cdot\\dfrac{2}{s^2+4}$ first.", "trap": {"text": "Students expect the leading $1$ in $F(s)=\\dfrac{1}{s^2+4}$ to mean amplitude $1$, missing that it must be rewritten as $\\tfrac12\\cdot\\dfrac{2}{s^2+4}$ first.", "avoid": "Match the table shape $\\dfrac{\\omega}{s^2+\\omega^2}$ exactly: here $\\omega=2$, so pull out the missing factor of $2$ before reading off the amplitude — it's $\\tfrac12$, not $1$."}}, {"at_progress": 0.9, "text": "Pole location alone sets the shape: zero real part means no decay; the imaginary part $\\omega=2$ sets the oscillation rate — the pole told you this before any table lookup."}, {"at_progress": 1.0, "text": "One full cycle done at $t=\\pi$, back to $f=0$ — and it repeats forever, since there is no decaying real part to damp it out.", "focus_point": true}]}
```
