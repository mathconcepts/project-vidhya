---
# Alternative body for chain-rule.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: chain-rule.hook.shaken
concept_id: chain-rule
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: chain-rule.hook
for_stance: shaken
---

A balloon's radius grows at $2$ cm/s, and right now $r=3$ cm. Volume is $V=\frac{4}{3}\pi r^3$, so $\frac{dV}{dr}=4\pi r^2=4\pi(9)=36\pi$. Multiply by the given rate: $\frac{dV}{dt}=36\pi\cdot2=72\pi$ cm³/s. One rate times another — that is the whole rule.

```interactive-spec
{"v":1,"kind":"simulation","title":"A balloon's volume accelerates even though its radius grows at a constant rate","why":"Volume grows non-linearly even though radius grows at a constant rate, because dV/dr itself grows with r — the chain rule multiplies two rates, it doesn't add them.","x_expr":"t","y_expr":"33.5103*t^3","t_min":0,"t_max":2.5,"duration_sec":7,"view_box":{"x_min":-0.2,"x_max":2.7,"y_min":-20,"y_max":560},"narration_steps":[{"at_progress":0.2,"focus_point":true,"text":"At t=0.5 s, the radius is 1 cm and the volume is 4.19 cm³. The radius keeps growing at a steady 2 cm/s — does the volume's own growth rate stay just as steady, or does it change as the balloon grows?","text_shaken":"At t=0.5: r=2(0.5)=1 cm. V=(4/3)π(1)³=4.19 cm³.","text_assured":"r=1, V=4.19 cm³ at t=0.5s — the real question is whether dV/dt stays constant as r grows, not the volume itself."},{"at_progress":0.4,"focus_point":true,"text":"By t=1s the radius has doubled to 2cm, and the volume has grown to 33.51 cm³ — over eight times its value at t=0.5, not just double.","text_shaken":"At t=1: r=2, V=(4/3)π(2)³=33.51 cm³. Volume grew ×8 while radius only doubled.","text_assured":"33.51 cm³ at t=1s — volume scales as r³, so doubling r multiplies V by 8, not 2."},{"at_progress":0.6,"focus_point":true,"text":"At t=1.5s the radius is 3cm and volume 113.10 cm³. Since the radius grows at a constant 2 cm/s, some students assume the volume must grow at some fixed cm³/s rate too.","text_shaken":"At t=1.5: r=3, V=(4/3)π(3)³=113.10 cm³. dV/dt here is 4π(3)²·2=226.19 cm³/s — already double the rate at t=1 (100.53 cm³/s), even though dr/dt never changed.","text_assured":"113.10 cm³ at t=1.5. dV/dt=226.19 cm³/s here, already ×2.25 the rate at t=1 — the radius's rate never changed; dV/dr did.","trap":{"text":"Students assume a constant dr/dt forces a constant dV/dt, ignoring that dV/dr itself depends on r.","avoid":"dV/dt = dV/dr · dr/dt — dr/dt is constant here, but dV/dr = 4πr² grows as the balloon grows, so the product keeps accelerating."}},{"at_progress":0.8,"focus_point":true,"emphasize":true,"text":"At t=2s the radius is 4cm, volume 268.08 cm³, and the volume's own growth rate has climbed to 402.12 cm³/s — quadruple the rate at t=1s (100.53 cm³/s), even though the radius is still growing at exactly 2 cm/s. The composite rate is not constant.","text_shaken":"At t=2: r=4, V=268.08 cm³. dV/dt=4π(4)²·2=402.12 cm³/s — four times the rate at t=1 (100.53 cm³/s).","text_assured":"268.08 cm³ at t=2s. dV/dt has grown ×4 since t=1 — matching r² doubling twice, since dV/dr∝r²."},{"at_progress":1.0,"focus_point":true,"text":"Why the rate keeps changing: dV/dt = dV/dr · dr/dt = 4πr² · 2. dr/dt=2 never changes, but dV/dr=4πr² grows as r grows — so their product, the chain rule's whole output, keeps accelerating. At t=2.5s the volume is 523.60 cm³ and dV/dt is 628.32 cm³/s.","text_shaken":"At t=2.5: r=5, V=523.60 cm³. dV/dt=4π(5)²·2=628.32 cm³/s. Multiply dV/dr by dr/dt every time — never add them, never skip either factor.","text_assured":"523.60 cm³ at t=2.5s, dV/dt=628.32 cm³/s. dV/dt=4πr²·2=8πr² — the chain rule's product, not a shortcut around it."}]}
```
