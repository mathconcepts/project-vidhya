---
# Alternative body for sampling-distributions.hook, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: sampling-distributions.hook.shaken
concept_id: sampling-distributions
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: sampling-distributions.hook
for_stance: shaken
---

Sample 30 students, get a mean height of 165.2 cm. Sample a different 30 tomorrow: maybe 164.8, maybe 165.9 — the number itself moved, even though the population didn't. That moving number, $\bar{X}$, is a random variable in its own right, with its own distribution — and how spread out THAT distribution is tells you how much to trust any one sample's answer.

```interactive-spec
{"v": 1, "kind": "simulation", "title": "The sampling distribution of the mean is far narrower than the population", "x_expr": "t", "y_expr": "exp(-1*pow(t-165,2)/0.5)/1.2533141373155001", "t_min": 163, "t_max": 167, "duration_sec": 8, "why": "This curve traces the SAMPLE MEAN's distribution across repeated draws, not individual heights — its narrow spread, the standard error $\\sigma/\\sqrt n$, is why one sample mean is trusted more than one lone observation.", "view_box": {"x_min": 162.5, "x_max": 167.5, "y_min": 0, "y_max": 0.9}, "narration_steps": [{"at_progress": 0.0, "text": "This traces the sampling distribution of $\\bar X$ from $n=30$ draws — not individual heights. Will its spread be about the same as individual students' heights, wider, or narrower?"}, {"at_progress": 0.45, "text": "One sample gave $\\bar x=164.8$ — on this curve, that lands at a good height, near the peak: a very plausible draw.", "focus_point": true}, {"at_progress": 0.5, "text": "The peak sits at $x=165$ — this curve's center is the true population mean $\\mu$, and its narrow width is the standard error $\\sigma/\\sqrt n$, far tighter than individual students' heights vary.", "emphasize": true, "focus_point": true}, {"at_progress": 0.725, "text": "A less common draw like $\\bar x=165.9$ still lands on this curve, just further from the peak — a rarer, but not impossible, sample mean under the same $\\bar X$ distribution.", "focus_point": true}, {"at_progress": 0.95, "text": "The lesson: this narrow curve belongs to $\\bar X$, the sample mean — not to individual student heights, which spread far more widely.", "trap": {"text": "Students treat the sampling distribution's narrow spread as if it described how much individual students' heights vary.", "avoid": "The standard error $\\sigma/\\sqrt n$ shrinks with $n$ because it measures the spread of AVERAGES, not of single observations — individual heights keep their own, much wider, spread regardless of $n$."}}]}
```
