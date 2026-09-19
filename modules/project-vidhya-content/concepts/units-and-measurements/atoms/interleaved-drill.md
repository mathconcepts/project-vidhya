---
id: units-and-measurements.interleaved-drill
concept_id: units-and-measurements
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.35
exam_ids: ["*"]
modality: drill
tested_by_atom: units-and-measurements.micro-exercise
---

**Cross-concept check: units-and-measurements → kinematics-1d.**

**Question 1 (error propagation into a kinematics quantity):** A student measures a distance $d = (10.0 \pm 0.1)$ m and a time $t = (2.0 \pm 0.05)$ s. Find the average speed $v = d/t$, with its percentage error.

*Answer:* $v = d/t = 10.0/2.0 = 5.0$ m/s. Since $v$ is a *quotient* of two measured quantities, the relative errors add: relative error in $d$ is $0.1/10.0=1\%$, relative error in $t$ is $0.05/2.0=2.5\%$, so relative error in $v$ is $1\%+2.5\%=3.5\%$. That gives $v = (5.0 \pm 0.175)$ m/s, rounded to $v = (5.0 \pm 0.2)$ m/s.

**Question 2 (which measurement to improve first):** Between improving the distance measurement's precision and improving the time measurement's precision, which one would cut the speed's error more?

*Answer:* The time measurement — it already contributes the larger share, $2.5\%$ out of the total $3.5\%$, even though its *absolute* error ($0.05$ s) looks smaller on paper than the distance's ($0.1$ m). What matters for error propagation in a quotient is the *relative* size of each error, not its raw numeric value.

**Why this drill exists:** speed, velocity, and acceleration — the very quantities kinematics is built from — are all formed by dividing one measured quantity by another. Every kinematics numerical problem quietly assumes the measurements feeding it are trustworthy; this concept is what actually justifies that assumption, or exposes when it fails.

