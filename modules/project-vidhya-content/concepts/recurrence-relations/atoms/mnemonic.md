---
id: recurrence-relations.mnemonic
concept_id: recurrence-relations
atom_type: mnemonic
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: mnemonic
---

**"Replace $a_n$ with $x^n$, drop to an algebra problem."** That's the whole method in one line: a linear constant-coefficient recurrence becomes a polynomial equation in $x$, and everything after is factoring and fitting constants.

**Root count = term count.** A degree-$2$ characteristic equation needs $2$ independent terms in the general solution — two distinct roots give two exponential terms; one repeated root gives $r^n$ **and** $n\cdot r^n$, never just $r^n$ twice.

**Sanity-check reflex:** after finding $A,B$, recompute $a_2$ from the closed form AND directly from the recurrence. If they disagree, the fitting step — not the recurrence — is where to look first.
