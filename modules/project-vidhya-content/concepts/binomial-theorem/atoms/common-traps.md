---
id: binomial-theorem.common-traps
concept_id: binomial-theorem
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: binomial-theorem.micro-exercise
---

**Trap 1 — Off-by-one term counting.** The general term is $T_{r+1} = \binom{n}{r}a^{n-r}b^r$, so the label is always one MORE than $r$. Asked for the 5th term, students plug $r=5$ into the formula instead of $r=4$, and get the 6th term by mistake.

**Trap 2 — Greatest coefficient mistaken for greatest term.** "Greatest coefficient" means the biggest $\binom{n}{r}$, a fact about $n$ alone — always at (or near) the middle. "Greatest term" means the biggest $T_{r+1}=\binom{n}{r}a^{n-r}b^r$ once $a$ and $b$ are real numbers, and its position depends on $a$ and $b$ too. A question asking for the greatest TERM cannot be answered by just finding the middle binomial coefficient.

**Trap 3 — Dropping the sign in $(a-b)^n$.** Writing $(a-b)^n$ as $(a+(-b))^n$ means every term of the expansion carries a factor of $(-1)^r$, alternating sign as $r$ increases. Students expand it as if it were $(a+b)^n$ and only fix the sign of the last term, missing that the sign alternates throughout.

**Trap 4 — Rewriting into $(a+b)^n$ form incorrectly.** For $\left(x-\frac{1}{x}\right)^n$, the correct identification is $a=x$, $b=-\frac{1}{x}$ — the minus sign belongs INSIDE $b$, not tacked onto the formula afterward. Getting this wrong flips the sign of every odd-$r$ term in the expansion.

**Trap 5 — Picking the wrong surviving term in a remainder problem.** After rewriting a base as (multiple of the divisor $\pm\,1)^n$ and expanding, students sometimes keep the FIRST term (the one with the highest power of the multiple) instead of the LAST one (the one with the multiple raised to the power $0$) — but it is the last term that survives mod the divisor, since every other term still carries at least one factor of the multiple.
