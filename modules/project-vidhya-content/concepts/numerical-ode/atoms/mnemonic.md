---
id: numerical-ode.mnemonic
concept_id: numerical-ode
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**The four scouts.** RK4 sends four scouts ahead each step to report the slope: one at the start, two at the midpoint (reporting slightly different estimates, since the second refines the first's guess), and one at the far end. Combine their reports as $1,2,2,1$ — the midpoint scouts count double because the midpoint slope best represents the whole interval — then divide by $6$ (the total weight) to get the step's actual slope.

**Worked check:** weights $1+2+2+1=6$, matching the denominator exactly — a constant slope $f\equiv c$ must give $y_{n+1}=y_n+\frac{h}{6}(c+2c+2c+c)=y_n+hc$, the same answer Euler would give for a truly constant slope.

**Sanity-check reflex:** before trusting an RK4 computation, confirm $k_2$ and $k_3$ were evaluated at $t_n+h/2$, not $t_n$ — reusing the starting time for every $k_i$ silently turns RK4 back into (a slower version of) Euler.
