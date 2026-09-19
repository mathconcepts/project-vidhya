---
id: statistics-jee.intuition-assured
concept_id: statistics-jee
atom_type: intuition
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
variant_of: statistics-jee.intuition
for_stance: assured
---

MD kills the sign by absolute value, variance kills it by squaring, SD undoes the squaring, CV normalises by the mean. The identity worth knowing cold: $\text{Var}(aX+b)=a^2\text{Var}(X)$, while $\text{Var}(aX+b)$ is completely unaffected by $b$. Shifting every observation by a constant (say, everyone's mark bumped up by $5$) never changes how spread out the marks are — only where the centre sits. Scaling every observation by a constant $a$, though, scales the variance by $a^2$, not by $a$: triple every mark, and the variance becomes NINE times bigger, not three. Counterexample to the tempting shortcut "variance scales the same way the mean does": mean of $3X+5$ is $3\bar x+5$ (both scale AND shift move the mean), but variance of $3X+5$ is $9\,\text{Var}(X)$ (only scale moves the variance, squared, and shift moves nothing).
