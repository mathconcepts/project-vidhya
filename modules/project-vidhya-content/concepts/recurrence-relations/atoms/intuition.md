---
id: recurrence-relations.intuition
concept_id: recurrence-relations
atom_type: intuition
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: visual
---

Start from a guess: maybe the closed form is just one geometric term, $a_n = c\cdot r^n$. Test it against $a_n=5a_{n-1}-6a_{n-2}$, $a_0=2,a_1=5$.

If $r=2$ alone: $a_0=c=2$ forces $c=2$, giving $a_1=2\cdot2=4$. But $a_1$ is actually $5$. Contradiction — a single term with $r=2$ can't match both initial conditions.

The recurrence's characteristic equation $x^2-5x+6=0$ actually has **two** roots, $2$ and $3$. The general solution needs both: $a_n=c_1 2^n+c_2 3^n$. Two unknowns, two initial conditions — solve $c_1+c_2=2$ and $2c_1+3c_2=5$ to get $c_1=1,c_2=1$, giving $a_n=2^n+3^n$.

Check: $a_2 = 4+9=13$, matching the direct computation from the recurrence. One geometric term was never enough because the recurrence has two independent roots, each contributing its own mode of growth.
