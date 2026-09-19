---
id: binomial-theorem.worked-example-assured
concept_id: binomial-theorem
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
variant_of: binomial-theorem.worked-example
for_stance: assured
scaffold_fade: true
---

**Problem:** Find the remainder when $7^{103}$ is divided by $25$.

$7^2=49=50-1$, and $50=2\times25$, so $7^{103}=7\cdot(50-1)^{51}$. Expanding by the binomial theorem, every term of $(50-1)^{51}$ carrying a positive power of $50$ is a multiple of $25$; only $r=51$ survives:

$$(50-1)^{51}\equiv(-1)^{51}\equiv24\pmod{25}\ \Rightarrow\ 7^{103}\equiv7\times24=168\equiv\boxed{18}\pmod{25}$$

**Watch the exponent's parity, not just its size.** The final sign flips with the parity of $51$ specifically, not with the size of $103$. Change the exponent on $7$ to an EVEN power instead — say $7^{102}=(7^2)^{51}=(50-1)^{51}$, same as above, still odd inner exponent, so no change there. But try $11^{50}\bmod4$: $11=12-1$, $12=3\times4$, and now the inner exponent is $50$, even, so the surviving term is $r=50$, giving $(-1)^{50}=+1$, not $-1$ — the remainder pattern flips sign depending on whether the rewritten exponent is odd or even, and reading the wrong parity is a fast way to lose the sign.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: remainder of a huge power using the binomial theorem","steps":[{"prompt":"You need the remainder of 7^103 on division by 25. Direct expansion has no multiple of 25 anywhere in it. What rewriting of 7^103 turns this into a binomial-theorem problem?","hint":"Look at 7^2. Is it close to a multiple of 25?","answer":"7^2 = 49 = 50 - 1, and 50 = 2 x 25. So 7^103 = 7 x (7^2)^51 = 7 x (50-1)^51."},{"prompt":"Expand (50-1)^51 using the general term. Which terms are guaranteed to vanish mod 25, and why?","hint":"The general term is C(51,r) x 50^(51-r) x (-1)^r. For which r is 50^(51-r) a multiple of 25?","answer":"50^(51-r) is a multiple of 25 whenever 51-r is at least 1, i.e. for every r from 0 to 50. Only r=51 leaves 50^0=1, so every term except r=51 vanishes mod 25."},{"prompt":"Only the r=51 term survives. What is it, and what remainder does that give for 7^103?","hint":"At r=51: C(51,51) x 50^0 x (-1)^51 = -1, which is 24 mod 25. Now multiply back the leftover factor of 7.","answer":"(50-1)^51 = 24 (mod 25). So 7^103 = 7 x 24 = 168 = 6x25+18 (mod 25), giving remainder 18."}]}
```
