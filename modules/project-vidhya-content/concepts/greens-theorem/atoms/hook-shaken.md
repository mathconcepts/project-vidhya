---
# Alternative body for greens-theorem.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: greens-theorem.hook.shaken
concept_id: greens-theorem
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: greens-theorem.hook
for_stance: shaken
---

Walk once around the unit square $[0,1]\times[0,1]$, counterclockwise, recording $\mathbf F\cdot d\mathbf r$ on each of the four sides separately. That is four separate one-dimensional integrals glued end to end — the direct route, before any shortcut through the interior enters the picture.

```interactive-spec
{"v": 1, "kind": "simulation", "title": "Circulation of F=(-y,x) around the unit circle", "why": "F=(-y,x) has curl exactly 2 everywhere — the same field used elsewhere in this concept. Watching the running circulation land on 2π, curl times the disk's area, is Green's theorem verified, not assumed.", "x_expr": "cos(t)", "y_expr": "sin(t)", "t_min": 0, "t_max": 6.283185307179586, "duration_sec": 8, "narration_steps": [{"at_progress": 0, "text": "The field is $\\mathbf F=(-y,x)$ — curl $=2$ everywhere, a constant. Before walking the whole boundary: can the single number 'curl$=2$' already predict what circulating once around the unit circle will total?", "text_shaken": "$\\mathbf F=(-y,x)$, curl $=2$ constant. Start at $(1,0)$ on the unit circle.", "text_assured": "curl $\\mathbf F=2$ constant: predict $\\oint_C\\mathbf F\\cdot d\\mathbf r$ from that number and the enclosed area alone, before parametrizing anything.", "focus_point": true, "emphasize": false}, {"at_progress": 0.5, "text": "Halfway round, at $(-1,0)$, the running total is $\\pi\\approx3.14$ — already matching curl times the area swept so far, $2\\times(\\pi/2)=\\pi$.", "text_shaken": "At $(-1,0)$, halfway: running total $\\approx3.14$.", "text_assured": "$(-1,0)$: running total $=\\pi=2\\times(\\text{half the disk's area})$ — tracking curl$\\times$area continuously, not only at the end.", "focus_point": true, "emphasize": false}, {"at_progress": 0.75, "text": "Three-quarters round, running total $\\approx4.71$ — three-quarters of the way to $2\\pi$.", "text_shaken": "Three-quarters round: running total $\\approx4.71$.", "text_assured": "$3\\pi/2\\approx4.71$ so far — proportional to the fraction of the disk swept, exactly as a constant curl predicts.", "emphasize": false, "trap": {"text": "Students report the circulation as just the curl value, 2, forgetting to multiply by the area it acts over.", "avoid": "Green's theorem gives circulation $=\\text{curl}\\times\\text{area}$ only when curl is genuinely constant; here $2\\times\\pi(1)^2=2\\pi$, not $2$ — the density must still be multiplied by how much region it covers."}}, {"at_progress": 1.0, "text": "Back at $(1,0)$ — the loop closes at a running total of exactly $2\\pi$, matching curl$\\times$area $=2\\times\\pi=2\\pi$ precisely. The boundary walk and the interior sum agree, as Green's theorem promises.", "text_shaken": "Back at $(1,0)$: total $=2\\pi\\approx6.28$, matching $2\\times\\pi$.", "text_assured": "$\\oint_C\\mathbf F\\cdot d\\mathbf r=2\\pi=\\iint_D2\\,dA$ — circulation and curl$\\times$area agree exactly, the theorem verified rather than assumed.", "focus_point": true, "emphasize": true}]}
```
