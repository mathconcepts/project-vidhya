---
id: sampling-distributions.hook
concept_id: sampling-distributions
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

You measure the average height of 30 students out of a class of 500 and get 165.2 cm. Pull a different 30 students tomorrow and you'd get a slightly different number — 164.8, 165.9, whatever. The sample mean is itself a random variable with its own distribution, and understanding *that* distribution is what lets you say how much you can trust a single sample's estimate.

```interactive-spec
{"v": 1, "kind": "simulation", "title": "The sampling distribution of the mean is far narrower than the population", "x_expr": "t", "y_expr": "exp(-1*pow(t-165,2)/0.5)/1.2533141373155001", "t_min": 163, "t_max": 167, "duration_sec": 8, "why": "This curve traces the SAMPLE MEAN's distribution across repeated draws, not individual heights — its narrow spread, the standard error $\\sigma/\\sqrt n$, is why one sample mean is trusted more than one lone observation.", "view_box": {"x_min": 162.5, "x_max": 167.5, "y_min": 0, "y_max": 0.9}, "narration_steps": [{"at_progress": 0.0, "text": "This traces the sampling distribution of $\\bar X$ from $n=30$ draws — not individual heights. Will its spread be about the same as individual students' heights, wider, or narrower?"}, {"at_progress": 0.45, "text": "One sample gave $\\bar x=164.8$ — on this curve, that lands at a good height, near the peak: a very plausible draw.", "focus_point": true}, {"at_progress": 0.5, "text": "The peak sits at $x=165$ — this curve's center is the true population mean $\\mu$, and its narrow width is the standard error $\\sigma/\\sqrt n$, far tighter than individual students' heights vary.", "emphasize": true, "focus_point": true}, {"at_progress": 0.725, "text": "A less common draw like $\\bar x=165.9$ still lands on this curve, just further from the peak — a rarer, but not impossible, sample mean under the same $\\bar X$ distribution.", "focus_point": true}, {"at_progress": 0.95, "text": "The lesson: this narrow curve belongs to $\\bar X$, the sample mean — not to individual student heights, which spread far more widely.", "trap": {"text": "Students treat the sampling distribution's narrow spread as if it described how much individual students' heights vary.", "avoid": "The standard error $\\sigma/\\sqrt n$ shrinks with $n$ because it measures the spread of AVERAGES, not of single observations — individual heights keep their own, much wider, spread regardless of $n$."}}]}
```
