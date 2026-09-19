---
id: binomial-theorem.worked-example
concept_id: binomial-theorem
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Find the remainder when $7^{103}$ is divided by $25$.

---

**Step 1 — Rewrite the base so a multiple of $25$ appears.** Direct expansion of $7^{103}$ has no multiple of $25$ anywhere in it, so first rewrite: $7^2 = 49 = 50-1$, and $50$ is exactly $2\times25$. So

$$7^{103} = 7\cdot(7^2)^{51} = 7\cdot(50-1)^{51}$$

---

**Step 2 — Expand $(50-1)^{51}$ by the binomial theorem.** With $a=50$, $b=-1$, $n=51$:

$$(50-1)^{51} = \sum_{r=0}^{51}\binom{51}{r}50^{51-r}(-1)^r$$

---

**Step 3 — Identify which terms survive mod $25$.** For $r=0,1,\dots,50$, the exponent $51-r$ is at least $1$, so $50^{51-r}$ is a multiple of $50$, hence a multiple of $25$ — every one of those terms is congruent to $0 \pmod{25}$. Only $r=51$ leaves $50^0=1$, so only that term survives:

$$(50-1)^{51} \equiv \binom{51}{51}(-1)^{51} \equiv -1 \equiv 24 \pmod{25}$$

---

**Step 4 — Multiply back the leftover factor of $7$.**

$$7^{103} = 7\cdot(50-1)^{51} \equiv 7 \times 24 = 168 \pmod{25}$$

$168 = 6\times25 + 18$, so

$$\boxed{7^{103} \equiv 18 \pmod{25}}$$

**Check:** the remainder must be between $0$ and $24$ — $18$ is in range, and $168-150=18$ confirms the division.

**JEE tip.** The whole method rests on one choice: rewrite the base as (a multiple of the divisor) $\pm\,1$, never anything else. Choosing $49$ or $51$ instead of $50$ throws away the divisibility and the shortcut disappears.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: remainder of a huge power using the binomial theorem","steps":[{"prompt":"You need the remainder of 7^103 on division by 25. Direct expansion has no multiple of 25 anywhere in it. What rewriting of 7^103 turns this into a binomial-theorem problem?","hint":"Look at 7^2. Is it close to a multiple of 25?","answer":"7^2 = 49 = 50 - 1, and 50 = 2 x 25. So 7^103 = 7 x (7^2)^51 = 7 x (50-1)^51."},{"prompt":"Expand (50-1)^51 using the general term. Which terms are guaranteed to vanish mod 25, and why?","hint":"The general term is C(51,r) x 50^(51-r) x (-1)^r. For which r is 50^(51-r) a multiple of 25?","answer":"50^(51-r) is a multiple of 25 whenever 51-r is at least 1, i.e. for every r from 0 to 50. Only r=51 leaves 50^0=1, so every term except r=51 vanishes mod 25."},{"prompt":"Only the r=51 term survives. What is it, and what remainder does that give for 7^103?","hint":"At r=51: C(51,51) x 50^0 x (-1)^51 = -1, which is 24 mod 25. Now multiply back the leftover factor of 7.","answer":"(50-1)^51 = 24 (mod 25). So 7^103 = 7 x 24 = 168 = 6x25+18 (mod 25), giving remainder 18."}]}
```
