---
id: numerical-ode.hook
concept_id: numerical-ode
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Most differential equations that show up in engineering — heat transfer, circuit transients, orbital motion — have no closed-form solution you can write down and evaluate. What you can always do is take small steps: start at a known point, use the equation itself to estimate the slope there, move a short distance along that slope, then repeat with the new slope. Euler's method is the simplest version of this dead-reckoning; Runge-Kutta methods sample the slope more cleverly within each step, buying far more accuracy for the same step size.
