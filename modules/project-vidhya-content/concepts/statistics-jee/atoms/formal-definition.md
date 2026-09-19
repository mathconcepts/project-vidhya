---
id: statistics-jee.formal-definition
concept_id: statistics-jee
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Ungrouped data** ($n$ observations $x_1,\dots,x_n$): mean $\bar x=\dfrac{\sum x_i}{n}$. Mean deviation about the mean: $\text{MD}=\dfrac{\sum|x_i-\bar x|}{n}$. Variance: $\sigma^2=\dfrac{\sum(x_i-\bar x)^2}{n}$. Standard deviation: $\sigma=\sqrt{\sigma^2}$.

*Example — mean deviation:* for $4,7,8,9,10,12,13,17$, $\bar x=10$, and $\text{MD}=\dfrac{|4-10|+|7-10|+\cdots+|17-10|}{8}=\dfrac{6+3+2+1+0+2+3+7}{8}=\dfrac{24}{8}=3$.

**Grouped data** (class marks $x_i$ with frequencies $f_i$, $N=\sum f_i$): mean $\bar x=\dfrac{\sum f_ix_i}{N}$. Mean deviation: $\text{MD}=\dfrac{\sum f_i|x_i-\bar x|}{N}$. Variance: $\sigma^2=\dfrac{\sum f_i(x_i-\bar x)^2}{N}$, equivalently the shortcut form $\sigma^2=\dfrac{\sum f_ix_i^2}{N}-\bar x^2$. Standard deviation: $\sigma=\sqrt{\sigma^2}$.

**Median (grouped, class interval form):** $\text{Median}=l+\left(\dfrac{N/2-cf}{f}\right)h$, where $l$ is the lower boundary of the median class, $cf$ the cumulative frequency before it, $f$ its own frequency, and $h$ its width.

**Mode (grouped):** $\text{Mode}=l+\left(\dfrac{f_1-f_0}{2f_1-f_0-f_2}\right)h$, where $f_1$ is the modal class's frequency, $f_0$ and $f_2$ the frequencies of the classes immediately before and after it.

**Coefficient of variation:** $\text{CV}=\dfrac{\sigma}{\bar x}\times100$. A LOWER coefficient of variation means MORE consistency, not more spread.

**Method selector.** For grouped data with equally-spaced class intervals, use the step-deviation method — substitute $u_i=\dfrac{x_i-A}{h}$ for an assumed mean $A$ (usually the class mark nearest the middle) and class width $h$, then $\bar x=A+\dfrac{\sum f_iu_i}{N}h$ and $\sigma^2=h^2\left[\dfrac{\sum f_iu_i^2}{N}-\left(\dfrac{\sum f_iu_i}{N}\right)^2\right]$ — this keeps every number small and avoids large-number arithmetic under time pressure. The tempting wrong method is using the raw class limits (say, "$10$" for the interval $10$–$20$) instead of the class MIDPOINT ($15$) as $x_i$ — grouped data always summarises with the midpoint, never an endpoint.
