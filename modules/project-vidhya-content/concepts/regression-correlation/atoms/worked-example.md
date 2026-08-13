---
id: regression-correlation-worked-example
concept_id: regression-correlation
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Worked Example — Regression Equation from Summary Statistics (GATE Style)

## Problem

For a sample of $n = 5$ observations the following sums are given:

$$\sum x_i = 15, \quad \sum y_i = 25, \quad \sum x_i^2 = 55, \quad \sum x_i y_i = 83$$

Find the regression equation $\hat{y} = a + bx$.

---

## Step 1 — Compute the Means

$$\bar{x} = \frac{\sum x_i}{n} = \frac{15}{5} = 3, \qquad \bar{y} = \frac{\sum y_i}{n} = \frac{25}{5} = 5$$

## Step 2 — Compute the Slope $b$

Use the computational formula to avoid rounding errors with deviations:

$$b = \frac{\sum x_i y_i - n\bar{x}\bar{y}}{\sum x_i^2 - n\bar{x}^2}$$

$$b = \frac{83 - 5 \cdot 3 \cdot 5}{55 - 5 \cdot 3^2} = \frac{83 - 75}{55 - 45} = \frac{8}{10} = 0.8$$

## Step 3 — Compute the Intercept $a$

$$a = \bar{y} - b\bar{x} = 5 - 0.8 \times 3 = 5 - 2.4 = 2.6$$

## Step 4 — Write the Regression Equation

$$\boxed{\hat{y} = 2.6 + 0.8\,x}$$

---

## Verification: Passes Through $(\bar{x}, \bar{y})$

$$\hat{y}\big|_{x=3} = 2.6 + 0.8 \times 3 = 2.6 + 2.4 = 5 = \bar{y} \checkmark$$

---

## Bonus: Correlation Coefficient Link

If additionally $\sum y_i^2 = 135$, then:

$$S_{xx} = \sum x_i^2 - n\bar{x}^2 = 10, \quad S_{yy} = \sum y_i^2 - n\bar{y}^2 = 135 - 125 = 10, \quad S_{xy} = 8$$

$$r = \frac{S_{xy}}{\sqrt{S_{xx} \cdot S_{yy}}} = \frac{8}{\sqrt{10 \times 10}} = \frac{8}{10} = 0.8$$

And $b = r \cdot \dfrac{\sqrt{S_{yy}}}{\sqrt{S_{xx}}} = 0.8 \cdot 1 = 0.8$ — consistent. $R^2 = 0.64$.

---

## Common GATE Traps

- Using $\sum x^2$ directly instead of $\sum x^2 - n\bar{x}^2$ for the denominator.
- Confusing the regression of $y$ on $x$ with $x$ on $y$: slope of $x$ on $y$ is $\dfrac{S_{xy}}{S_{yy}} = 0.8$, slope of $y$ on $x$ is $\dfrac{S_{xy}}{S_{xx}} = 0.8$ (equal here by coincidence since $S_{xx}=S_{yy}$).
- Forgetting that the product $b_{yx} \cdot b_{xy} = r^2$, useful as a check.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"Given n=4, Σx=8, Σy=12, Σx²=22, Σxy=28. Compute the slope b of the regression of y on x.","hint":"Use b = (Σxy − n·x̄·ȳ) / (Σx² − n·x̄²). First find x̄ = Σx/n = 2 and ȳ = Σy/n = 3.","answer":"b = (28 − 4·2·3) / (22 − 4·4) = (28 − 24)/(22 − 16) = 4/6 = 2/3 ≈ 0.667"},{"prompt":"Now find the intercept a, and write the regression equation.","hint":"Use a = ȳ − b·x̄ with x̄=2, ȳ=3, b=2/3.","answer":"a = 3 − (2/3)·2 = 3 − 4/3 = 5/3 ≈ 1.667. Equation: ŷ = 5/3 + (2/3)x"}]}
```
