# Teaching Tips: Probability Basics

## Common Student Errors

- **Confusing "or" with addition rule for non-mutually-exclusive events**: Students often write $P(A \cup B) = P(A) + P(B)$ even when $A$ and $B$ overlap. The correct formula is $P(A \cup B) = P(A) + P(B) - P(A \cap B)$. Red flag: if the student adds two probabilities and gets > 1, they have overlap!
- **Forgetting to use the complement for "at least one" problems**: Many students try to enumerate all cases for "at least one success in $n$ trials," which is tedious. The complement rule $P(A) = 1 - P(A^c)$ is faster: find the probability of zero successes, then subtract from 1.
- **Treating dependent events as independent**: When drawing cards without replacement from a deck, each draw changes the sample space. Students write $P(A \text{ then } B) = P(A) \times P(B)$ when they should use conditional probability, $P(A \text{ then } B) = P(A) \times P(B|A)$.

## GATE Question Pattern

GATE tests three types of probability problems: (1) **Sample space + counting** — "find the probability of rolling a sum of 7 with two dice" (needs both counting principles and probability formula, ~1 mark), (2) **Events and rules** — "find P(A or B) given P(A), P(B), P(A and B)" (applies addition rule or De Morgan's law, ~1–2 marks, MCQ or NAT), and (3) **Multi-step scenarios** — "probability of success in at least $k$ of $n$ independent trials" (uses complement rule and independence, ~2 marks). GATE rarely asks for definitions in isolation; expect applied problems.

## Speed Tricks for MCQs

- **Use the complement rule for "at least one"**: Instead of computing $P(\text{exactly 1}) + P(\text{exactly 2}) + \cdots$, always use $P(\text{at least 1}) = 1 - P(\text{none})$. This saves time and reduces calculation errors.
- **Recognize mutually exclusive vs. independent**: Mutually exclusive means $P(A \cap B) = 0$ (disjoint), so $P(A \cup B) = P(A) + P(B)$. Independent means the occurrence of one doesn't affect the other, so $P(A \cap B) = P(A) \times P(B)$. Reading carefully avoids misapplying formulas.
- **Simplify fractions early**: When calculating $\frac{6}{36}$ or $\frac{13}{52}$, always reduce: $\frac{6}{36} = \frac{1}{6}$ and $\frac{13}{52} = \frac{1}{4}$. This makes mental arithmetic faster and reduces transcription errors.

## Must-Memorize Formulas / Results

**Classical Probability:**
$$P(A) = \frac{|A|}{|S|}$$

**Axioms:**
$$0 \le P(A) \le 1$$
$$P(S) = 1$$

**Complement Rule:**
$$P(A^c) = 1 - P(A)$$

**Addition Rule (Mutually Exclusive):**
$$P(A \cup B) = P(A) + P(B)$$

**Addition Rule (General):**
$$P(A \cup B) = P(A) + P(B) - P(A \cap B)$$

**Multiplication Rule (Independent Events):**
$$P(A \cap B) = P(A) \times P(B)$$

**Multiplication Rule (Dependent Events):**
$$P(A \cap B) = P(A) \times P(B|A)$$

**Conditional Probability:**
$$P(A|B) = \frac{P(A \cap B)}{P(B)}, \quad P(B) > 0$$

**De Morgan's Laws:**
$$(A \cup B)^c = A^c \cap B^c$$
$$(A \cap B)^c = A^c \cup B^c$$
