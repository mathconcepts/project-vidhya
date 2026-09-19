---
id: waves-mechanical.worked-example-assured
concept_id: waves-mechanical
atom_type: worked_example
variant_of: waves-mechanical.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Same siren — but sanity-check the approaching answer with a fast estimate before trusting the exact fraction.

---

**A quick estimate, valid only when $v_s\ll v$.** $f'\approx f(1+v_s/v)=500(1+20/340)\approx529.4$ Hz — close to, but not exactly, the true value, because this linear approximation drops higher-order terms that only vanish when $v_s$ is much smaller than $v$.

---

**The exact answer, from the real formula.** $f'=f\dfrac{v}{v-v_s}=500\times\dfrac{340}{320}=531.25$ Hz.

$$\boxed{f'_{approach}=531.25\ \text{Hz},\quad f'_{recede}=472.22\ \text{Hz}}$$

---

**Why the estimate is only a check, not an answer.** The two values differ by about $1.8$ Hz here — small, but real, and it grows once $v_s/v$ stops being small. On a JEE-level numerical-value question the exact fraction is required; the linear estimate exists only to catch a gross arithmetic slip, such as an answer that comes out below $500$ Hz for a source that is clearly approaching.
