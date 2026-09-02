---
id: boolean-algebra.exam-pattern
concept_id: boolean-algebra
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT/MCQ "minimize this SOP expression" questions** give $3$ to $5$ variables as a minterm list or a truth table and ask for the minimal expression, or its number of literals/terms.

  Example: $\Sigma m(1,3,5,6,7)$ on $3$ variables minimizes to $C+AB$ — $2$ terms, $3$ literals total, verified against the original $5$-term SOP.

- **MSQ "which of the following groupings are valid K-map groups" questions** test the power-of-$2$-size rule and wraparound adjacency directly, often with a deliberately invalid $3$-cell or non-adjacent grouping among the options.

- **MCQ "identify the equivalent Boolean identity" questions** pair a De Morgan or absorption expansion with several candidate simplifications; substituting a small truth-value case (say $A=1,B=0$) into each candidate quickly eliminates wrong options without a full proof.

- **Time budget:** a $3$-variable K-map minimization should take under $90$ seconds once the minterms are plotted; plotting itself should take under $30$ seconds for $\le5$ minterms.
