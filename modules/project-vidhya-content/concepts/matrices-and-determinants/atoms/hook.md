---
id: matrices-and-determinants.hook
concept_id: matrices-and-determinants
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

To send a secret message, write it as numbers and multiply by an encoding matrix. Take $E=\begin{pmatrix}3&2\\5&4\end{pmatrix}$ and the message "HI" as $(8,9)$ (using $A=1,\dots,I=9$). Multiplying gives the ciphertext $(42,76)$ — a pair of numbers meaning nothing on their own. To read the message back, the receiver needs $E^{-1}$, and $E^{-1}$ exists only because $\det(E)=3(4)-2(5)=2\neq0$. If the sender had instead picked an encoding matrix with determinant $0$, the message could still be SENT — but it could never be decoded, by anyone, ever. The whole scheme's safety and its readability both hinge on one number.
