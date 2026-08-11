---
id: regression-correlation.formal-definition
concept_id: regression-correlation
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Correlation Coefficient ($r$)**: Measures the strength and direction of a linear relationship between two variables $X$ and $Y$.
$$r = \frac{\sum_{i=1}^n (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum_{i=1}^n (x_i - \bar{x})^2 \sum_{i=1}^n (y_i - \bar{y})^2}} = \frac{s_{xy}}{s_x s_y}$$

where $s_{xy}$ is the sample covariance and $s_x, s_y$ are the sample standard deviations.

**Properties**: $-1 \le r \le 1$. 
- $r = 1$: Perfect positive linear relationship.
- $r = -1$: Perfect negative linear relationship.
- $r = 0$: No linear relationship.
- $|r| > 0.7$: Strong linear relationship.

**Simple Linear Regression**: Fits a line $\hat{y} = a + bx$ to the data, minimizing the sum of squared residuals.

$$b = \frac{\sum_{i=1}^n (x_i - \bar{x})(y_i - \bar{y})}{\sum_{i=1}^n (x_i - \bar{x})^2} = r \frac{s_y}{s_x}$$

$$a = \bar{y} - b\bar{x}$$

**Coefficient of Determination ($R^2$)**: The proportion of variance in $Y$ explained by $X$.
$$R^2 = r^2$$

**Sum of Squares**:
- Total: $SS_T = \sum_{i=1}^n (y_i - \bar{y})^2$
- Regression: $SS_R = \sum_{i=1}^n (\hat{y}_i - \bar{y})^2$
- Residual: $SS_E = \sum_{i=1}^n (y_i - \hat{y}_i)^2$
- Property: $SS_T = SS_R + SS_E$

Geometric interpretation: the regression line passes through $(\bar{x}, \bar{y})$ and has slope $b$ proportional to the correlation coefficient $r$. The closer data points lie to this line, the larger $R^2$ (better fit). The correlation coefficient $r$ is symmetric in $X$ and $Y$, whereas the regression slope $b$ is directional (predicting $Y$ from $X$).
