---
id: group-theory-basics.mnemonic
concept_id: group-theory-basics
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**"CAIN"** — **C**losure, **A**ssociativity, **I**dentity, i**N**verse — is the checklist to run down, in the order that catches trouble fastest: closure fails on operations that can leave the set, associativity almost never fails for standard operations (check it last, quickly), identity is usually obvious, and the inverse is where students get sloppy — assuming it exists rather than naming it.

**Worked micro-example:** verify $(\mathbb{Z}_4, +)$ is a group. Closure: $a+b \bmod 4$ always lands back in $\{0,1,2,3\}$. Associativity: addition is always associative. Identity: $0$, since $a+0=a$. Inverse: every element needs a named partner summing to $0 \bmod 4$ — for $3$, that partner is $1$, since $3+1=4\equiv 0 \pmod 4$.

**Sanity-check reflex:** if you can't name the inverse of every element on sight, the group isn't verified yet — closure and associativity are rarely where GATE hides the trap; the inverse is.
