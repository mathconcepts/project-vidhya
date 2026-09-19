---
id: binomial-theorem.worked-example-shaken
concept_id: binomial-theorem
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
variant_of: binomial-theorem.worked-example
for_stance: shaken
scaffold_fade: true
---

**Problem:** Find the remainder when $7^{103}$ is divided by $25$.

**Step 1.** $7^2 = 49$. Write $49 = 50 - 1$. Note $50 = 2\times25$, a multiple of $25$. So

$$7^{103} = 7\cdot(7^2)^{51} = 7\cdot(50-1)^{51}$$

**Step 2.** Expand $(50-1)^{51}$ term by term using $a=50,\ b=-1,\ n=51$:

$$(50-1)^{51} = \sum_{r=0}^{51}\binom{51}{r}50^{51-r}(-1)^r$$

**Step 3.** Look at each term's power of $50$. For $r=0$ up to $r=50$, the power $51-r$ is $1$ or more, so that whole term is a multiple of $50$, and so a multiple of $25$ — it contributes $0$ to the remainder. Only $r=51$ is different: $50^0=1$. So only that one term matters:

$$(50-1)^{51} \equiv (-1)^{51} \equiv -1 \equiv 24 \pmod{25}$$

**Step 4.** Bring back the factor of $7$ from Step 1:

$$7^{103} \equiv 7\times24 = 168 \pmod{25}$$

Divide: $168 = 6\times25+18$. The remainder is $18$.

$$\boxed{7^{103} \equiv 18 \pmod{25}}$$

**Check:** $18$ is between $0$ and $24$, and $6\times25=150$, $168-150=18$. Correct.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: remainder of a huge power using the binomial theorem","steps":[{"prompt":"You need the remainder of 7^103 on division by 25. Direct expansion has no multiple of 25 anywhere in it. What rewriting of 7^103 turns this into a binomial-theorem problem?","hint":"Look at 7^2. Is it close to a multiple of 25?","answer":"7^2 = 49 = 50 - 1, and 50 = 2 x 25. So 7^103 = 7 x (7^2)^51 = 7 x (50-1)^51."},{"prompt":"Expand (50-1)^51 using the general term. Which terms are guaranteed to vanish mod 25, and why?","hint":"The general term is C(51,r) x 50^(51-r) x (-1)^r. For which r is 50^(51-r) a multiple of 25?","answer":"50^(51-r) is a multiple of 25 whenever 51-r is at least 1, i.e. for every r from 0 to 50. Only r=51 leaves 50^0=1, so every term except r=51 vanishes mod 25."},{"prompt":"Only the r=51 term survives. What is it, and what remainder does that give for 7^103?","hint":"At r=51: C(51,51) x 50^0 x (-1)^51 = -1, which is 24 mod 25. Now multiply back the leftover factor of 7.","answer":"(50-1)^51 = 24 (mod 25). So 7^103 = 7 x 24 = 168 = 6x25+18 (mod 25), giving remainder 18."}]}
```
