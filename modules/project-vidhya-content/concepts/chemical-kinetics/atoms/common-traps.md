---
id: chemical-kinetics.common-traps
concept_id: chemical-kinetics
atom_type: common_traps
bloom_level: 4
difficulty: 0.45
exam_ids: ["*"]
---

- **Treating order and molecularity as the same number**: order comes only from experiment (the measured exponents in the rate law) and can be zero, fractional, or negative; molecularity is a mechanistic count of colliding molecules in ONE elementary step, and must be a small positive whole number. They can coincide for a genuinely single-step reaction, but nothing guarantees it — a multi-step reaction's order is set by its slowest step alone, not by the overall equation.

- **Reading order straight off a balanced equation's stoichiometric coefficients**: $2\text{N}_2\text{O}_5\rightarrow4\text{NO}_2+\text{O}_2$ is experimentally first order, not second, despite the "$2$" in front of $\text{N}_2\text{O}_5$. Coefficients balance atoms; they say nothing about the rate law.

- **Forgetting to divide by the stoichiometric coefficient when reading rate off ONE species**: for $2A\rightarrow B$, the rate of disappearance of $A$ is TWICE the rate of appearance of $B$ — the "rate of reaction" itself is $-\dfrac{1}{2}\dfrac{d[A]}{dt}=\dfrac{d[B]}{dt}$, and quoting a species' own concentration change as "the rate" without checking which species (and its coefficient) silently gives a value off by a fixed factor.

- **Assuming half-life is always independent of starting concentration**: this is true ONLY for first order. Zero order's half-life is directly proportional to $[A]_0$, and second order's half-life is inversely proportional to $[A]_0$ — using the first-order formula on a reaction of a different order gives a wrong, and wrongly-behaving, answer.

- **Assuming a higher activation energy always means a slower reaction at every temperature**: it means the rate is MORE sensitive to temperature change, from the Arrhenius equation $k=Ae^{-E_a/RT}$ — comparing two reactions' actual rates also depends on their pre-exponential factor $A$, not on $E_a$ alone.
