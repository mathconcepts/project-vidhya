---
id: numerical-ode.hook
concept_id: numerical-ode
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

When you can't solve a differential equation analytically, you simulate the solution by taking tiny steps forward. You start at a known point, estimate the slope (using the ODE), take a small step in that direction, and repeat. More steps = more accuracy, but slower. It's like dead reckoning in navigation: you know your current position and heading, so you extrapolate where you'll be next.
