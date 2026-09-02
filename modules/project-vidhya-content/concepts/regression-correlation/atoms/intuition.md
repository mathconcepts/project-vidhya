---
id: regression-correlation.intuition
concept_id: regression-correlation
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

## Regression and Correlation — What Is the Relationship?

When two variables $x$ and $y$ move together, we want to **measure** how strongly they are linked (correlation) and **predict** one from the other (regression).

## Correlation

The **Pearson correlation coefficient** $r$ (sample) or $\rho$ (population) quantifies the *strength and direction* of the linear relationship:

$$r = \frac{\sum (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum(x_i - \bar{x})^2 \cdot \sum(y_i - \bar{y})^2}}$$

- $r = +1$: perfect positive linear relationship
- $r = -1$: perfect negative linear relationship
- $r = 0$: no linear relationship (variables may still be non-linearly related)
- $r \in (-1, 1)$: partial linear association

## Simple Linear Regression

We model $y$ as a linear function of $x$:

$$\hat{y} = a + bx$$

where the **least squares** estimates minimize $\sum (y_i - \hat{y}_i)^2$:

$$b = \frac{\sum(x_i - \bar{x})(y_i - \bar{y})}{\sum(x_i - \bar{x})^2}, \qquad a = \bar{y} - b\bar{x}$$

Note: $b = r \cdot \dfrac{s_y}{s_x}$, linking regression slope to the correlation coefficient.

## Coefficient of Determination $R^2$

$$R^2 = r^2 \quad \text{(for simple linear regression)}$$

$R^2 \in [0,1]$ tells us the **fraction of variance in $y$ explained by $x$**.
- $R^2 = 0.81$ means 81% of the variability in $y$ is captured by the regression line.

## Multiple Regression

For $k$ predictors:

$$\hat{y} = \beta_0 + \beta_1 x_1 + \beta_2 x_2 + \cdots + \beta_k x_k$$

Estimated by the same least-squares principle: minimise the sum of squared residuals. In GATE the focus is usually on simple linear regression.

## Key Warnings

- **Correlation $\neq$ causation.** A high $r$ between ice-cream sales and drownings does not mean one causes the other (both are driven by summer).
- **Extrapolation** beyond the range of data is unreliable.
- The regression of $y$ on $x$ is not the same line as the regression of $x$ on $y$ (unless $|r| = 1$).
