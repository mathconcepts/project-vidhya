---
id: dual-nature-matter.hook-assured
concept_id: dual-nature-matter
atom_type: hook
variant_of: dual-nature-matter.hook
for_stance: assured
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

"Brighter light gives faster photoelectrons" is the single most tempting wrong answer JEE sets up here — it feels obviously true, and it is exactly backwards.

Intensity (brightness) only sets how many photons — light's discrete energy packets — arrive per second, so it only raises the **photocurrent** (electrons ejected per second), never the electrons' top kinetic energy. Only **frequency** ($f$) sets that: $KE_{max}=hf-\phi$, where $\phi$ is the **work function** (least energy needed to free one electron) and $h$ is Planck's constant.

Counterexample: shine a very dim violet light and a blindingly bright red light on one sodium plate, violet above the threshold frequency and red below it. Dim violet ejects fast photoelectrons; bright red, however intense, ejects none — brightness cannot buy what frequency alone provides.

```interactive-spec
{"v":1,"kind":"simulation","title":"Stopping potential vs frequency, above the threshold","why":"The stopping potential (the reverse voltage needed to stop the fastest photoelectrons) climbs in a straight line once light crosses the threshold frequency — watch where it starts and how its slope never changes.","x_expr":"t","y_expr":"0.4136*t - 2.3","t_min":5.6,"t_max":10,"duration_sec":6,"reference_points":[{"id":"threshold","label":"threshold","x":5.56,"y":0}],"narration_steps":[{"at_progress":0,"text":"Just above the threshold frequency, the stopping potential (reverse voltage needed to stop the fastest electrons) is almost zero — electrons barely escape.","text_shaken":"Right at the threshold, stopping potential is 0 volts. Electrons just barely get out, with almost no leftover speed.","text_assured":"At the threshold frequency, the fastest electron's kinetic energy is 0 — it just clears the work function and no more.","emphasize":false,"focus_point":true},{"at_progress":0.35,"text":"Now imagine the light gets much brighter, at this same frequency — more photons per second hit the plate. Will this line move up?","text_shaken":"Picture the same colour of light, just much brighter. Does the stopping potential value on this graph change?","text_assured":"Predict: does raising intensity at fixed frequency shift a point on this line at all?","emphasize":false},{"at_progress":0.55,"text":"It does not move. Brighter light means more photons arriving per second, so more photoelectrons — but each photon still carries the same energy $hf$, so the fastest electron's energy is unchanged.","text_shaken":"No shift. Brighter light sends more photons, so more electrons escape — but each photon's own energy hf has not changed, so the top speed has not changed.","text_assured":"Intensity moves photocurrent, never this line. Each photon's energy depends only on f, so the stopping potential is deaf to brightness.","emphasize":false,"trap":{"text":"Students often expect brighter light to raise the stopping potential, since brighter usually means \"more energy\" in everyday language.","avoid":"Intensity only changes how many photons arrive per second. Only frequency changes the energy each photon carries — that is the one dial this line responds to."}},{"at_progress":1,"text":"Every metal gives a line with this exact same slope, $h/e$ — only where the line crosses zero (set by that metal's work function) differs from one metal to the next.","text_shaken":"Every metal's line has the same slope, h/e. Only the starting point (the threshold) shifts, because different metals hold their electrons with different strength.","text_assured":"The universal slope h/e is how this experiment first pinned down Planck's constant — the intercept alone carries the metal-specific work function.","emphasize":true}]}
```
