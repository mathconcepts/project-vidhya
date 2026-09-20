---
id: chemical-kinetics.hook-shaken
concept_id: chemical-kinetics
atom_type: hook
variant_of: chemical-kinetics.hook
for_stance: shaken
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

An experiment measures the initial rate of a reaction $A \rightarrow \text{products}$ at two different starting concentrations of $A$. At $[A]=0.1\ \text{mol/L}$, the rate is $2\times10^{-3}\ \text{mol/L/s}$. At $[A]=0.2\ \text{mol/L}$ (double the concentration), the rate is $8\times10^{-3}\ \text{mol/L/s}$ (four times higher).

Doubling $[A]$ made the rate four times larger: $4=2^2$. Since rate $\propto [A]^n$, this means $2^n=4$, so $n=2$.

Check: $\text{rate}=k[A]^2$. Using the first data point, $k=\dfrac{2\times10^{-3}}{(0.1)^2}=\dfrac{2\times10^{-3}}{0.01}=0.2\ \text{L/mol/s}$.

Verify against the second point: $k[A]^2=0.2\times(0.2)^2=0.2\times0.04=8\times10^{-3}\ \text{mol/L/s}$ — matches exactly. This reaction is second **order** in $A$, found entirely from measured rate data — not assumed from how the equation happens to be written.
