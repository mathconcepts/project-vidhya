---
id: units-and-measurements.intuition
concept_id: units-and-measurements
atom_type: intuition
bloom_level: 2
difficulty: 0.05
exam_ids: ["*"]
---

Every measured number secretly has two parts: the digits you read off the instrument, and an unstated "give or take" that comes from the instrument's own **least count** (the smallest gap it can distinguish). A ruler marked in millimetres cannot honestly claim to know a length to the nearest micrometre, no matter how carefully you squint at it.

**Significant figures** are the rule that keeps a calculated answer from lying about this. When you *add or subtract* measured numbers, the answer can only be as precise (as many places after the decimal point) as the least precise number in the sum. When you *multiply or divide*, the answer can only have as many significant figures as the measurement with the fewest — a long calculator display does not create precision that was never measured.

**Error propagation** extends the same idea to formulas. If a quantity is built from measured inputs by multiplication, division, or a power (like $V=a^3$), the *relative* (fractional) errors of the inputs add up — a small error in $a$ gets multiplied by the power it is raised to. If a quantity is built by addition or subtraction, it is the *absolute* errors that add, not the relative ones. Mixing the two rules up is the single most common way marks are lost here.

