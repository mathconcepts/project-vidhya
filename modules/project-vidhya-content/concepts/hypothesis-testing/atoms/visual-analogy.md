---
id: hypothesis-testing.visual_analogy
concept_id: hypothesis-testing
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
modality: visual
---

## The Court Trial Analogy

Imagine a criminal court. The defendant walks in with the presumption of **innocence** — that is $H_0$: "The defendant did not commit the crime." The prosecution (your data) must present evidence strong enough to **overthrow** this presumption beyond reasonable doubt. Only then does the judge (the test) **reject $H_0$** and declare the defendant guilty.

## Mapping the Analogy

| Court | Hypothesis Testing |
|---|---|
| Presumption of innocence | $H_0$ is assumed true |
| Prosecution presents evidence | You compute a test statistic from your sample |
| "Beyond reasonable doubt" threshold | Significance level $\alpha$ (e.g., 5%) |
| Verdict: Guilty (reject innocence) | Reject $H_0$ |
| Verdict: Not Guilty (insufficient evidence) | Fail to reject $H_0$ |

## The Two Errors as Verdict Mistakes

**Type I Error — Convicting an innocent person:** you reject $H_0$ even though it is true. The evidence looked damning, but it was a coincidence (random sampling). Probability $= \alpha$.

**Type II Error — Acquitting a guilty person:** you fail to reject $H_0$ even though it is false. The evidence existed, but your sample was too small or too noisy to expose it. Probability $= \beta$.

## Why This Matters

A court sets a *high* standard ("beyond reasonable doubt") to protect the innocent — that is choosing a *small* $\alpha$ to guard against false alarms. But a stricter standard also means more guilty people go free (higher $\beta$): the fundamental **trade-off between Type I and Type II errors**.

Under $H_0$, the test statistic follows a known curve — the standard normal below. The shaded tails beyond $\pm 1.96$ are the rejection region at $\alpha=0.05$: land there, and the "verdict" is reject $H_0$.

```gif-scene
{"type":"function-trace","expression":"exp(-(x*x)/2)","x_range":[-4,4],"y_range":[0,1.1],"title":"The standard normal curve under H0 — tails past ±1.96 are the rejection region"}
```

## Remember

- "Not guilty" $\neq$ "innocent." Failing to reject $H_0$ is not the same as proving it.
- The p-value is not the probability that $H_0$ is true. It is the probability of seeing data this extreme *if* $H_0$ were true.
