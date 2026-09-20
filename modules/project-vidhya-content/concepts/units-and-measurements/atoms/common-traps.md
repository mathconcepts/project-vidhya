---
id: units-and-measurements.common-traps
concept_id: units-and-measurements
atom_type: common_traps
bloom_level: 4
difficulty: 0.2
exam_ids: ["*"]
---

- **Mixing up the addition rule with the multiplication rule for significant figures**: for addition/subtraction, count decimal places, not significant figures. Adding $12.3$ (one decimal place) and $1.234$ (three decimal places) gives an answer rounded to *one* decimal place ($13.5$), not carried out to three just because one input had that many.

- **Adding absolute errors where relative errors were needed, or the reverse**: absolute errors ($\Delta A + \Delta B$) only add directly for a *sum or difference*. For a product, quotient, or power, it is the *relative* errors ($\Delta A/A$) that add — plugging absolute errors straight into a product's error formula silently gives a wrong, usually much smaller, error than the real one.

- **Forgetting that a power multiplies the relative error, not just repeats it**: for $Z=A^n$, the relative error in $Z$ is $n$ times the relative error in $A$, not the same size. Treating $V=a^3$ like a simple product of three *independent* measurements (which would still add three equal relative errors, giving the same factor of $3$ by coincidence) can mislead when the power is not $3$ — for $Z=A^2/B$, the error contribution from $A$ is doubled, from $B$ is not.

- **Reporting an error to more significant figures than the answer itself**: an error like $\Delta V = 0.145$ cm$^3$ should be rounded to one or two significant figures ($0.1$ cm$^3$), and the answer's own significant figures should match that rounded error, not the calculator's raw output.

- **Reading trailing zeros as significant when there is no decimal point**: $100$ m could mean $1$, $2$, or $3$ significant figures depending on how it was measured — only $100.$ m or $1.00\times10^2$ m unambiguously means three. This ambiguity is exactly why scientific notation is preferred for reporting a measured value.

