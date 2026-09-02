---
id: numerical-error-analysis.intuition
concept_id: numerical-error-analysis
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

## How wrong, and wrong compared to what?

Every numerical computation works with approximations — a measured length, a truncated decimal, a value read off an instrument. Error analysis tracks how far an approximation strays from the true value, and how that gap grows or shrinks as you compute with it.

**Absolute vs. relative error.** $E_a=|x_t-x_a|$ is the raw gap; $E_r=E_a/|x_t|$ normalizes it against the size of $x_t$, and $\times100$ gives the percentage error. A $1$ cm error on a $10$ m beam is trivial; the same $1$ cm on a $2$ cm bolt is a disaster — only $E_r$ distinguishes the two.

**Rounding vs. truncation error.** Rounding error comes from representing a number with finitely many digits — chopping $3.14159\ldots$ to $3.1416$. Truncation error comes from cutting an infinite or iterative process short — stopping a Taylor series after a few terms, or a root-finder after $n$ steps. One is about representation; the other about approximating a process, and more decimal places fixes only the first.

**Error propagation.** Combine two approximate quantities and their errors combine too, by a rule that depends on the operation: for addition/subtraction, absolute errors add (never cancel, in the worst case); for multiplication/division, relative errors approximately add instead.
