---
id: units-and-measurements.formal-definition
concept_id: units-and-measurements
atom_type: formal_definition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

**SI base units** (Système International, the worldwide-agreed measurement system): metre (m, length), kilogram (kg, mass), second (s, time), ampere (A, electric current), kelvin (K, temperature), mole (mol, amount of substance), candela (cd, luminous intensity).

**Dimensional formula**: any physical quantity written as a product of powers of $[M]$ (mass), $[L]$ (length), $[T]$ (time), and other base dimensions. Example: speed $=$ distance/time has dimensional formula $[M^0L^1T^{-1}]$.

**Principle of homogeneity**: only quantities with the *same* dimensional formula can be added, subtracted, or set equal to each other. This is used both to check whether a formula could be correct, and to derive how one quantity depends on others.

**Significant figures — counting rule**: all non-zero digits are significant; zeros between non-zero digits are significant; leading zeros (before the first non-zero digit) are never significant; trailing zeros are significant only if there is a decimal point.

**Significant figures — combining measurements**:
- Addition/subtraction: the result is rounded to the same number of decimal places as the input with the *fewest* decimal places.
- Multiplication/division: the result is rounded to the same number of significant figures as the input with the *fewest* significant figures.

**Error propagation**, for a quantity $Z$ built from measured $A$ (with absolute error $\Delta A$) and $B$ (with absolute error $\Delta B$):
- $Z=A+B$ or $Z=A-B$: $\Delta Z = \Delta A + \Delta B$ (absolute errors add).
- $Z=AB$ or $Z=A/B$: $\dfrac{\Delta Z}{Z} = \dfrac{\Delta A}{A} + \dfrac{\Delta B}{B}$ (relative errors add).
- $Z=A^n$: $\dfrac{\Delta Z}{Z} = n\dfrac{\Delta A}{A}$ (the relative error is multiplied by the power).

