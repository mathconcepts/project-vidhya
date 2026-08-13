---
id: regression-correlation-visual-analogy
concept_id: regression-correlation
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# The Scatter Plot of Heights and Weights

Imagine you record the **height** ($x$) and **weight** ($y$) of 30 students and plot each student as a dot on a graph — height on the horizontal axis, weight on the vertical axis.

## What You See

- The dots are scattered, but they form a *cloud that tilts upward*: taller students tend to weigh more.
- This upward tilt is **positive correlation** ($r > 0$).
- If the dots were scattered randomly with no tilt, $r \approx 0$.
- If the tilt went downward (like hours of sleep vs cups of coffee), $r < 0$.

## The Regression Line as the "Best Fit"

Now imagine you want to draw **one straight line** through that cloud so that it sits as centrally as possible. The least-squares line does exactly this: it minimises the sum of the **squared vertical distances** from each dot to the line (the "residuals").

- Each vertical distance $e_i = y_i - \hat{y}_i$ is one student's prediction error.
- Squaring them penalises large errors more than small ones.
- The line that makes $\sum e_i^2$ as small as possible is your regression line.

## The Slope $b$ Tells the Story

If $b = 0.7$, it means: for every extra centimetre of height, weight increases by 0.7 kg **on average** along the line. The intercept $a$ is where the line crosses the $y$-axis (often has no physical meaning when 0 is outside the data range).

## $R^2$: How Tight Is the Cloud?

- A very narrow, elongated cloud (dots close to the line) $\Rightarrow$ high $R^2$, the line explains most of the variation.
- A wide, diffuse cloud $\Rightarrow$ low $R^2$, height alone is a poor predictor of weight.

## The Key Visual Insight

The regression line always passes through the **point of means** $(\bar{x}, \bar{y})$. No matter what the data, the line is "anchored" at the average height and average weight. Everything else pivots around this centre.
