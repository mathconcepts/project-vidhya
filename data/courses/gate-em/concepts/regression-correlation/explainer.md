# Regression & Correlation

> GATE Engineering Mathematics | Probability & Statistics | medium frequency | difficulty: 0.5

## Intuition First
You observe that as study hours increase, exam scores tend to increase — but not perfectly. Correlation measures the strength of this linear relationship. Regression finds the best-fit line through the data, allowing you to predict exam scores from study hours.

## Core Definition

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

## What Happens (Worked Example)

Label: "**What happens:**"

**Problem**: Five students' study hours ($X$) and exam scores ($Y$):

| Study Hours | Score |
|---|---|
| 2 | 50 |
| 3 | 60 |
| 4 | 65 |
| 5 | 75 |
| 6 | 85 |

Find the correlation coefficient and the regression line.

**Step 1: Compute means.**
$$\bar{x} = \frac{2+3+4+5+6}{5} = 4, \quad \bar{y} = \frac{50+60+65+75+85}{5} = 67$$

**Step 2: Compute sum of products and sum of squares.**
$$\sum (x_i - \bar{x})(y_i - \bar{y}) = (-2)(-17) + (-1)(-7) + (0)(-2) + (1)(8) + (2)(18)$$
$$= 34 + 7 + 0 + 8 + 36 = 85$$

$$\sum (x_i - \bar{x})^2 = 4 + 1 + 0 + 1 + 4 = 10$$

$$\sum (y_i - \bar{y})^2 = 289 + 49 + 4 + 64 + 324 = 730$$

**Step 3: Compute correlation.**
$$r = \frac{85}{\sqrt{10 \times 730}} = \frac{85}{\sqrt{7300}} = \frac{85}{85.44} \approx 0.995$$

**Step 4: Compute regression slope and intercept.**
$$b = \frac{85}{10} = 8.5$$
$$a = 67 - 8.5 \times 4 = 67 - 34 = 33$$

**Regression line**: $\hat{y} = 33 + 8.5x$

Label: "**Why it works:**"

The regression line minimizes squared vertical deviations (residuals) from the observed points. The slope $b = 8.5$ indicates that for each additional study hour, the expected score increases by 8.5 points. The high correlation $r \approx 0.995$ (very close to 1) indicates an almost perfect linear fit; $R^2 \approx 0.99$ means 99% of variance in scores is explained by study hours, leaving only 1% unexplained.

## GATE MA Relevance
> **Why it matters in GATE MA:** Regression and correlation appear in ~20% of GATE probability & statistics questions. GATE tests computation of $r$, fitting a regression line, interpretation of $R^2$, confidence intervals for regression coefficients, and F-tests for the significance of the regression. These concepts are foundational for statistical modeling and quality control in engineering applications.
