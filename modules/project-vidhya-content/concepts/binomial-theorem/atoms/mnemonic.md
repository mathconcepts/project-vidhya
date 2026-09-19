---
id: binomial-theorem.mnemonic
concept_id: binomial-theorem
atom_type: mnemonic
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: mnemonic
---

**"DAB" — Descending $a$, Ascending $b$.** In every term of $(a+b)^n$, the power of $a$ counts DOWN from $n$ to $0$ while the power of $b$ counts UP from $0$ to $n$, and the two powers always add to $n$. Once you know the power of $b$ is $r$, the power of $a$ is automatically $n-r$ — no need to track both.

**"+1 because you started at 0."** The general term is $T_{r+1}$, not $T_r$, purely because counting starts at $r=0$. Say it out loud once and the off-by-one mistake stops happening.

**Coefficients climb a hill, they don't zigzag.** Read $\binom{n}{0},\binom{n}{1},\dots,\binom{n}{n}$ left to right: the values climb, peak once at (or near) the centre, then fall — never a second bump. That is why "greatest coefficient" always has a clean centre answer.

**But the greatest TERM can sit off-centre — drag below to see why.** The moment $a$ and $b$ carry real values, the coefficient's own symmetric hill gets tilted by the growing or shrinking powers of $a$ and $b$, and the peak can slide away from the middle entirely.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Find the greatest term in (1+x)^12 at x=2, without computing a single coefficient",
  "why": "The ratio of one term to the next only needs subtraction and division, not a single binomial coefficient computed outright — drag r and watch exactly where the ratio drops below 1, which is where the terms stop growing.",
  "inputs": [
    {"id": "r", "label": "r (comparing T(r+1) to T(r))", "min": 1, "max": 12, "step": 1, "initial": 1}
  ],
  "outputs": [
    {"label": "Ratio T(r+1) / T(r) = 2(13-r)/r", "formula": "2*(13 - r) / r", "digits": 3}
  ],
  "caption": "This is the expansion of (1+x)^12 with x=2, so a=1 and b=2. Drag r from 1 to 12. While the ratio stays above 1, each next term is bigger than the last. Find the r where the ratio first drops below 1 — the term just before that drop is the greatest term. It lands at r=9 (T9), off-centre from the middle term T7, exactly because b=2 keeps pushing later terms up."
}
```
