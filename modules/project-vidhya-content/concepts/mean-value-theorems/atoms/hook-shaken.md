---
# Alternative body for mean-value-theorems.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: mean-value-theorems.hook.shaken
concept_id: mean-value-theorems
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: mean-value-theorems.hook
for_stance: shaken
---

Drive $100$ km in $2$ hours: average speed $=\frac{100}{2}=50$ km/h. At some instant during the trip your speedometer had to read exactly $50$ km/h — not roughly, exactly — because you can't average $50$ while staying strictly above or strictly below it the whole way. That instant is what the Mean Value Theorem guarantees exists.

```interactive-spec
{"v":1,"kind":"simulation","title":"Speed falls from 130 to 50 km/h — crossing the 90 km/h average exactly once","why":"This traces your speed over the 2-hour trip: it falls steadily from 130 to 50 km/h and must cross the 90 km/h average exactly once on the way — the instant the Mean Value Theorem guarantees exists.","x_expr":"t","y_expr":"130 - 40*t","t_min":0,"t_max":2,"duration_sec":8,"view_box":{"x_min":-0.15,"x_max":2.25,"y_min":40,"y_max":140},"narration_steps":[{"at_progress":0.0,"text":"At the start of the trip ($t=0$h), the speedometer reads $130$ km/h — well above the $90$ km/h average this whole 2-hour drive must net out to.","text_shaken":"Start of the trip, $t=0$h: speed $=130$ km/h. Above the $90$ average — hold that number.","text_assured":"$v(0)=130$ km/h — comfortably above the $90$ km/h average speed for this trip.","focus_point":true},{"at_progress":0.25,"text":"By $t=0.5$h, speed has eased to $110$ km/h — still above average. As it keeps falling toward $50$ km/h, will it cross exactly $90$ km/h before the halfway mark ($t=1$h), exactly at it, or after?","text_shaken":"At $t=0.5$h: speed $=110$ km/h, still above $90$. Guess: does the exact-$90$ moment land before $t=1$h, at $t=1$h, or after?","text_assured":"$v(0.5)=110$ km/h. Predict where $v(t)=90$ falls relative to the interval's midpoint, $t=1$h."},{"at_progress":0.5,"text":"At $t=1$h — exactly the midpoint of the 2-hour trip — the speedometer reads exactly $90$ km/h, matching the average. This is the instant the Mean Value Theorem guarantees must exist.","text_shaken":"At $t=1$h: speed $=90$ km/h exactly, the same number as the trip's average speed. This is the guaranteed instant.","text_assured":"$v(1)=90$ — exactly the average, landing at the midpoint here (true for THIS curve, not a general MVT promise).","emphasize":true,"focus_point":true},{"at_progress":0.65,"text":"Speed started above the average ($130$) and is ending below it ($50$); since it changes continuously with no jumps, it cannot skip over $90$ km/h on the way down — it has to cross that exact value somewhere. That crossing is the real content of the theorem.","text_shaken":"Speed began above $90$ (at $130$) and must end below $90$ (at $50$) — since it never jumps, it has to pass through $90$ exactly once.","text_assured":"Continuity of $v(t)$ forces the crossing: above at $t=0$, below at $t=2$, so $v(t)=90$ somewhere strictly between — no jump possible."},{"at_progress":0.85,"text":"By $t=1.7$h, speed has fallen to $62$ km/h — well past the exact-$90$ crossing already.","trap":{"text":"Students assume the guaranteed instant always lands exactly at the middle of the time interval.","avoid":"That coincidence happened only because this position curve is quadratic, making its derivative a straight line; the Mean Value Theorem itself never promises WHERE in $(a,b)$ the instant falls — only that one exists somewhere inside it."}},{"at_progress":1.0,"text":"By $t=2$h, speed has fallen all the way to $50$ km/h and the trip is over — but the guarantee already happened back at $t=1$h. That is the whole promise of MVT: an instant exists, confirmed once, never a coincidence tied to this particular curve's shape.","text_shaken":"At $t=2$h: speed $=50$ km/h, trip done. The guaranteed instant already happened at $t=1$h.","text_assured":"$v(2)=50$. The crossing at $t=1$h already satisfied the theorem — its existence, not its location, is what MVT actually promises.","focus_point":true}]}
```
