---
id: statistics-jee.interleaved-drill
concept_id: statistics-jee
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
modality: drill
tested_by_atom: statistics-jee.micro-exercise
---

**Cross-concept check: statistics → probability.**

**Question 1 (statistics):** Find the variance of the data $2,4,6,8,10$, treating each value as equally likely (frequency $1$ out of $5$).

*Answer:* Mean $=6$. Variance $=\dfrac{\sum(x-\bar x)^2}{n}=\dfrac{16+4+0+4+16}{5}=\dfrac{40}{5}=8$.

**Question 2 (probability):** A random variable $X$ takes the values $0,1,2$ with probabilities $0.25,0.5,0.25$. Find $E(X)$ and $\text{Var}(X)$.

*Answer:* $E(X)=0(0.25)+1(0.5)+2(0.25)=0+0.5+0.5=1$.

$$\text{Var}(X)=\sum p_i(x_i-E(X))^2=0.25(0-1)^2+0.5(1-1)^2+0.25(2-1)^2=0.25+0+0.25=0.5$$

**Why this drill exists.** Look at the two variance formulas side by side: statistics uses $\dfrac{f_i}{N}$ as the weight on each squared deviation; probability uses $p_i$ directly. They are literally the SAME formula — a frequency divided by the total count IS a probability, once you notice that $\dfrac{f_i}{N}$ and $p_i$ both just mean "how likely is this value." Mean in statistics and expectation $E(X)$ in probability are the same idea told in two courses' worth of different vocabulary.
