---
id: alternating-current.visual-analogy
concept_id: alternating-current
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

Picture two runners on a circular track, running at exactly the same constant speed, lap after lap. The second runner starts a fixed distance behind the first — say, a sixth of the track. Because their speeds are identical, that gap never grows or shrinks: at every instant, the second runner is at the exact point on the track the first one occupied a sixth-of-a-lap earlier.

Voltage and current in an AC circuit are these two runners. Both trace out the same shape (a sine wave), at the same rate ($\omega$), lap after lap — but current can be running a fixed fraction of a lap behind voltage (an inductive circuit) or ahead of it (a capacitive one). Knowing one runner's exact position tells you the other's instantly, because the gap between them is fixed by the circuit itself, not by the moment you happen to look.

The curve below traces current lagging voltage by a sixth of a full cycle ($60^\circ$) — the same fixed-gap picture, drawn out as a wave instead of two runners on a track.

```gif-scene
{"type":"function-trace","title":"Current lagging voltage by 60 degrees","expression":"sin(x - 1.0472)","x_range":[0,6.283],"y_range":[-1.2,1.2],"frames":30,"fps":12}
```
