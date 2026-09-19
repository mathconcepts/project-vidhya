---
id: oscillations-shm.hook-assured
concept_id: oscillations-shm
atom_type: hook
variant_of: oscillations-shm.hook
for_stance: assured
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

"Speed is greatest where displacement is greatest" reads as an obvious guess about oscillation — it is exactly backwards for SHM, and a real source of lost marks under time pressure.

The restoring force, and so the acceleration, is greatest at maximum displacement — that is where the object is being pulled back hardest, which is also precisely where it is momentarily at rest, about to reverse. Speed is greatest instead at zero displacement, where the restoring force (and acceleration) is itself zero. Two quantities that both matter — displacement and speed — are maximum at completely different instants, a quarter cycle apart, never together.

```interactive-spec
{"v":1,"kind":"simulation","title":"Displacement and velocity in SHM — the 90-degree lag","why":"Displacement is extreme where the restoring force has just finished pulling back, so velocity is momentarily zero there. Displacement is zero where that same force has pushed longest, so velocity peaks there instead.","x_expr":"cos(t)","y_expr":"-sin(t)","t_min":0,"t_max":6.283185307179586,"duration_sec":4,"narration_steps":[{"at_progress":0,"text":"Right now, displacement is at its full swing height (taken as x=1 here) and speed is exactly zero — the split second before the swing falls back the other way."},{"at_progress":0.25,"text":"A quarter cycle later, displacement is back to zero at the centre, and speed reaches its greatest magnitude here — this is where the swing moves fastest.","emphasize":true,"trap":{"text":"A common wrong guess is that speed peaks at the same instant as displacement, writing v_max at x=A.","avoid":"Speed is zero exactly where displacement is maximum, and speed is greatest exactly where displacement is zero. The two peaks never happen together."}},{"at_progress":0.5,"text":"Another quarter cycle on, displacement reaches its full height on the opposite side, and speed is zero again."},{"at_progress":0.75,"text":"One quarter cycle before the pattern repeats, displacement is back at the centre and speed again reaches its greatest magnitude, now in the opposite direction from the 0.25 mark."}],"caption":"This loop traces displacement (horizontal) against velocity (vertical) over one full SHM cycle — velocity always reaches its greatest magnitude a quarter cycle after displacement does, never at the same instant."}
```
