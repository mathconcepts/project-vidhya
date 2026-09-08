---
# Alternative body for product-quotient-rule.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: product-quotient-rule.hook.assured
concept_id: product-quotient-rule
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: product-quotient-rule.hook
for_stance: assured
---

Recognizing $\dfrac{u}{v}$ with $v$ a genuine function, not a constant, is the cue GATE hides inside "differentiate this quotient" — and the fastest route often skips the quotient rule's larger denominator entirely: rewrite $\dfrac{u}{v}=u\cdot v^{-1}$ and apply the product rule with chain rule on $v^{-1}$, since $(v^{-1})'=-v^{-2}v'$. Reaching for the quotient rule on $u/c$ for a constant $c$ is the wasted-motion version of the same mistake in reverse — factor out $\frac1c$ and differentiate $u$ alone.

```interactive-spec
{"v":1,"kind":"simulation","title":"f(x) = x²eˣ grows faster than u'v' alone predicts","why":"f'=u'v+uv' has two terms because both u and v change at once — multiplying the two rates together (u'·v') badly undercounts the true rate of change.","x_expr":"t","y_expr":"t^2*exp(t)","t_min":0,"t_max":1.5,"duration_sec":7,"view_box":{"x_min":-0.15,"x_max":1.65,"y_min":-1,"y_max":11.5},"narration_steps":[{"at_progress":0.2,"focus_point":true,"text":"At x=0.3, f(x)=x²eˣ is only 0.121. u=x² is growing (u'=2x), and v=eˣ is growing too (v'=eˣ). Predict: is the overall rate f' just u'×v', or something else?","text_shaken":"At x=0.3: f=x²eˣ=0.09×1.350=0.121. u'=2x=0.6, v'=eˣ=1.350 here.","text_assured":"0.121 at x=0.3 — the real question is whether f'=u'v' works, not the value of f itself."},{"at_progress":0.4,"focus_point":true,"text":"By x=0.6, f has grown to 0.656 — both u and v are growing, and the curve is climbing faster than either alone.","text_shaken":"At x=0.6: f=0.36×1.822=0.656. u'=1.2, v'=1.822 here — multiply those together and see if it later matches the real rate.","text_assured":"0.656 at x=0.6 — u and v are both increasing, and the coupling between them is what the product rule accounts for."},{"at_progress":0.6,"focus_point":true,"text":"At x=0.9, some students guess the rate of change is simply u'×v' = 2x·eˣ — treating the two factors' rates as independent.","text_shaken":"At x=0.9: f=0.81×2.460=1.992. u'v'=1.8×2.460=4.428 — but the real rate f'=e^0.9(1.8+0.81)=6.420. Not close.","text_assured":"1.992 at x=0.9. u'v'=4.428 undercounts the true rate 6.420 by nearly a third — multiplying the two rates directly is not the rule.","trap":{"text":"Students multiply the two derivatives directly, u'·v', assuming the product's rate is the product of the individual rates.","avoid":"The correct rate is u'v+uv' — u'·v' alone (4.43 here) undercounts the true rate (6.42) by nearly a third."}},{"at_progress":0.8,"focus_point":true,"emphasize":true,"text":"At x=1.2, f=4.781, and the real rate of change is f'=eˣ(2x+x²)=12.749 — nowhere near u'·v'=7.968. The correct rule adds two terms, it never multiplies the two rates.","text_shaken":"At x=1.2: f=1.44×3.320=4.781. u'v'=2.4×3.320=7.968; the real f'=3.320×(2.4+1.44)=12.749. The gap only grows.","text_assured":"4.781 at x=1.2. f'=12.749 versus the wrong guess u'v'=7.968 — the product rule's two-term sum, not a single product of rates."},{"at_progress":1.0,"focus_point":true,"text":"Why: f'=u'v+uv' has two terms because BOTH factors are changing at once — each contributes its own term while the other is held fixed. At x=1.5, f=10.084 and f'=eˣ(2x+x²)=23.529, matching u'v+uv' exactly, never u'·v'.","text_shaken":"At x=1.5: f=2.25×4.482=10.084. f'=u'v+uv'=(3)(4.482)+(2.25)(4.482)=13.446+10.084=23.529. Two terms added, never multiplied.","text_assured":"10.084 at x=1.5; f'=23.529=u'v+uv' — the product rule's additive structure, derived from both factors changing together, is the whole rule."}]}
```
