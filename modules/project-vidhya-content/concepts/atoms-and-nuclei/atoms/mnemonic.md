---
id: atoms-and-nuclei.mnemonic
concept_id: atoms-and-nuclei
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Lyman, Balmer, Paschen — UV, Visible, IR, in that order."** The series landing on $n_1=1,2,3$ are, respectively, ultraviolet, visible, and infrared — both the fixed level number and the light's colour rise together, in step.

**For decay: "half of what's left, every single time — never half of what you started with."** Each half-life always acts on whatever remains *right now*, not on the original amount — that is the whole reason it never reaches exactly zero.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag starting count, half-life, and elapsed time — watch how many nuclei remain",
  "why": "N = N0 x 2^(-t/T) is just repeated halving written as one formula — drag any slider and watch the remaining count rebuild instantly, for any sample, not only the 30-day example above.",
  "inputs": [
    {"id": "N0", "label": "starting count N0", "min": 100, "max": 1000, "step": 50, "initial": 800},
    {"id": "T", "label": "half-life T (days)", "min": 1, "max": 30, "step": 1, "initial": 10},
    {"id": "t", "label": "elapsed time t (days)", "min": 0, "max": 60, "step": 5, "initial": 30}
  ],
  "outputs": [
    {"label": "Nuclei remaining N = N0 x 2^(-t/T)", "formula": "N0*2^(-t/T)", "digits": 1}
  ],
  "caption": "Start at N0=800, T=10, t=30 (exactly 3 half-lives): N=100, matching the worked example. Drag t up and N keeps shrinking toward 0 without ever quite touching it."
}
```
