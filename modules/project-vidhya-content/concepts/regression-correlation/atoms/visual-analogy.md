---
id: regression-correlation.visual_analogy
concept_id: regression-correlation
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
modality: visual
---

## The Scatter Plot of Heights and Weights

Imagine you record the **height** ($x$) and **weight** ($y$) of 30 students and plot each student as a dot — height on the horizontal axis, weight on the vertical axis.

## What You See

- The dots are scattered, but they form a *cloud that tilts upward*: taller students tend to weigh more. This upward tilt is **positive correlation** ($r > 0$).
- If the dots were scattered randomly with no tilt, $r \approx 0$. If the tilt went downward, $r < 0$.

## The Regression Line as the "Best Fit"

Draw **one straight line** through that cloud so it sits as centrally as possible. The least-squares line minimises the sum of the **squared vertical distances** from each dot to the line (the residuals). Each vertical distance $e_i = y_i - \hat{y}_i$ is one student's prediction error; squaring penalises large errors more than small ones.

## The Slope $b$ Tells the Story

If $b = 0.8$, for every extra unit of $x$, $y$ increases by $0.8$ **on average** along the line. The line on this card traces $\hat{y}=2.6+0.8x$ from the worked example — a straight rule, not a curve, and every point on it is a *prediction*, not a guarantee.

```gif-scene
{"type":"function-trace","expression":"2.6 + 0.8*x","x_range":[0,6],"y_range":[0,8],"title":"The least-squares line ŷ = 2.6 + 0.8x"}
```

## $R^2$: How Tight Is the Cloud?

A narrow, elongated cloud (dots close to the line) $\Rightarrow$ high $R^2$. A wide, diffuse cloud $\Rightarrow$ low $R^2$ — the predictor alone explains little of the variation.

## The Key Visual Insight

The regression line always passes through the **point of means** $(\bar{x}, \bar{y})$, whatever the data — everything else pivots around this centre.
