---
# Alternative body for discrete-distributions.hook, served when the
# learner stance is `shaken`. See src/content/stance-variants.ts.
id: discrete-distributions.hook.shaken
concept_id: discrete-distributions
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: discrete-distributions.hook
for_stance: shaken
---

A call center gets 2 calls per minute, on average.

What's the chance of exactly 0 calls next minute? There's no fixed set of trials here to count — calls just arrive.

That's the Poisson distribution's job: $P(X=k) = \dfrac{e^{-\lambda}\lambda^k}{k!}$, with $\lambda=2$ as the average rate.

For $k=0$: $P(X=0)=e^{-2}\approx0.135$.

Four distributions, four different stories — matching the story to the shape is the actual skill here.

```interactive-spec
{"v": 1, "kind": "simulation", "why": "Poisson's own $P(X{=}0)=e^{-\\lambda}$ decays smoothly as the rate rises — watching it fall shows exactly how much rarer 'nothing happens' gets as events get more frequent.", "title": "How often does NOTHING happen, as the call rate rises?", "x_expr": "t", "y_expr": "exp(-t)", "t_min": 0, "t_max": 4, "duration_sec": 7, "narration_steps": [{"at_progress": 0.0, "text": "At $\\lambda=0$ calls/minute, the chance of exactly zero calls is trivially $1$. Predict: as the average rate climbs to the call center's own $\\lambda=2$, does that chance fall a little, or drop by more than half?", "focus_point": true}, {"at_progress": 0.25, "text": "At $\\lambda=1$ call/minute, $P(X=0)=e^{-1}\\approx0.368$ — already well under half.", "focus_point": true}, {"at_progress": 0.5, "text": "At the call center's own $\\lambda=2$, $P(X=0)=e^{-2}\\approx0.135$ — the exact number the hook started with.", "focus_point": true}, {"at_progress": 0.65, "text": "Each extra unit of rate multiplies the zero-call chance by the same factor $e^{-1}\\approx0.368$ — Poisson's zero-probability decays exponentially in $\\lambda$, never in a straight line."}, {"at_progress": 0.85, "text": "By $\\lambda=3.4$, $P(X=0)$ has fallen to about $0.033$.", "focus_point": true, "trap": {"text": "Students think an average of $2$ calls per minute means exactly $2$ calls happen almost every minute.", "avoid": "Poisson spreads probability across many counts — at $\\lambda=2$, exactly $2$ calls is only about $27\\%$ likely, and $0$, $1$, $3$, $4\\ldots$ calls each have real probability too."}}, {"at_progress": 1.0, "text": "By $\\lambda=4$, $P(X=0)\\approx0.018$ — nothing happening has become rare, even though it started as a certainty at $\\lambda=0$.", "focus_point": true}]}
```
