---
# Alternative body for change-of-basis.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: change-of-basis.hook.assured
concept_id: change-of-basis
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: change-of-basis.hook
for_stance: assured
---

Coordinates are basis-dependent; the vector isn't. $[x]_B$ and $[x]_{B'}$ describe the same geometric object under two different bases, related by $[x]_{B'} = P^{-1}[x]_B$ for the change-of-basis matrix $P$.

The one thing worth locking in early: $P$'s columns are the *old* basis vectors written in the *new* basis's coordinates. Build it that way and every conversion collapses to a single matrix multiply — getting the direction backwards is the exam's favorite trap.

```interactive-spec
{"v":1,"kind":"simulation","title":"The basis vector e1 rotating 45 degrees — same physical direction, new coordinates","x_expr":"cos(t)","y_expr":"sin(t)","t_min":0,"t_max":0.785398,"duration_sec":6,"view_box":{"x_min":-1.3,"x_max":1.3,"y_min":-1.3,"y_max":1.3},"narration_steps":[{"at_progress":0.0,"text":"This traces $e_1'$ as it turns from $(1,0)$ — imagine rotating the page by 45°.","text_shaken":"Start at $(1,0)$, angle $0°$. Nothing has changed yet.","text_assured":"The vector isn't moving in space here — only the labeling axes are; keep that distinction sharp before writing $P$."},{"at_progress":0.4,"text":"Partway through, at $(0.95,0.31)$ — 18° of the turn, still the same physical direction, just renamed.","text_shaken":"$(0.95,0.31)$ now, 18° in. The point on the page hasn't moved; the axis has.","text_assured":"Coordinates are basis-relative the whole way through — there is no 'the' coordinates of a point without naming a basis."},{"at_progress":0.75,"text":"At $(0.83,0.56)$, this direction is a column of $P=[e_1'\\,|\\,e_2']$ — $P$'s columns are the NEW basis, written in OLD coordinates.","text_shaken":"$(0.83,0.56)$. This is a column of $P$, in old coordinates. $P$ converts new coordinates to old, not old to new.","text_assured":"$[x]_E=P[x]_B$ — to go the other way you invert: $[x]_B=P^{-1}[x]_E$, never $P[x]_E$.","trap":{"text":"Students build $P$ from the new basis vectors and then multiply directly to get new coordinates from old: $[x]_{new}=P[x]_{old}$.","avoid":"$P$ sends NEW-basis coordinates to OLD ($[x]_E=P[x]_B$); to find new coordinates from old, use $P^{-1}$, not $P$."}},{"at_progress":1.0,"text":"At $(0.707,0.707)$, the full 45° turn done — this column is $e_1'$ in old coordinates, and finding a point's NEW coordinates still needs $P^{-1}$.","text_shaken":"$(0.707,0.707)$ reached. Same rule at every angle: $P$ goes new-to-old; invert for old-to-new.","text_assured":"Whatever the rotation angle, the direction of $P$ never flips on its own — only inverting it does.","emphasize":true}]}
```
