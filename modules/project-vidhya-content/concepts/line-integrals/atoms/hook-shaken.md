---
# Alternative body for line-integrals.hook, served when the learner stance
# is `shaken`. Concrete-first, smallest true step, arithmetic in full,
# explicit check at the end.
id: line-integrals.hook.shaken
concept_id: line-integrals
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: line-integrals.hook
for_stance: shaken
---

Take $\mathbf F(x,y)=(-y,x)$ and the unit circle $x=\cos t,\ y=\sin t$, $t:0\to2\pi$ — a closed loop, back where it began.

**Step 1 — velocity.** $\mathbf r'(t)=(-\sin t,\cos t)$.

**Step 2 — dot product.** $\mathbf F\cdot\mathbf r'=(-\sin t)(-\sin t)+(\cos t)(\cos t)=\sin^2t+\cos^2t=1$.

**Step 3 — integrate.** $\int_0^{2\pi}1\,dt=2\pi$.

**Check.** The path returns exactly to its start, yet the total work is $2\pi$, not $0$. Work along this field depends on the path taken, not only on where it starts and ends.

```interactive-spec
{"v": 1, "kind": "simulation", "why": "Watching the loop close while the work total keeps climbing is the fastest way to see why a closed path can still do nonzero work — a fact that's easy to state and hard to believe from algebra alone.", "title": "A closed loop that still does work", "x_expr": "cos(t)", "y_expr": "sin(t)", "t_min": 0, "t_max": 6.283, "duration_sec": 8, "narration_steps": [{"at_progress": 0, "text": "The path is the unit circle, traced once counter-clockwise. The force field pushes tangentially — always in the direction you're already moving.", "text_shaken": "Watch a dot trace a full circle. At every point, the push points the same way the dot is already moving.", "text_assured": "$\\mathbf F(x,y)=(-y,x)$: tangential to every circle centered at the origin, magnitude equal to the radius.", "emphasize": false}, {"at_progress": 0.3, "text": "Since the push always matches the direction of travel, every step of the path adds positive work — none of it cancels.", "text_shaken": "The push always matches the direction the dot is moving, so work keeps adding up — nothing ever cancels.", "text_assured": "$\\mathbf F\\cdot\\mathbf r'=\\sin^2t+\\cos^2t=1$ at every instant — a constant integrand, not a coincidence of this particular field.", "emphasize": true}, {"at_progress": 0.75, "text": "The dot is closing in on where it started.", "text_shaken": "The dot is almost back to its starting point.", "text_assured": "As $t\\to2\\pi$, $\\mathbf r(t)\\to\\mathbf r(0)$ — the endpoint condition every conservative-field shortcut relies on.", "emphasize": false, "trap": {"text": "Students assume a path that returns to its start must do zero net work, the way going nowhere seems to accomplish nothing.", "avoid": "Check whether the field is conservative FIRST. Here it isn't — the loop closes, but the accumulated work is $2\\pi$, not $0$."}}, {"at_progress": 1, "text": "Back at the start — and the total work is $2\\pi$, not $0$. A closed loop only guarantees zero work when the field is conservative; this one isn't.", "text_shaken": "Back where it began — but the work is $2\\pi$, not $0$. Returning to the start does not mean nothing happened.", "text_assured": "$\\oint\\mathbf F\\cdot d\\mathbf r=2\\pi\\neq0$ — the signature of a non-conservative field; Green's theorem later ties this directly to $\\text{curl}\\,\\mathbf F$.", "emphasize": true}]}
```
