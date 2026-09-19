---
id: matrices-and-determinants.hook-shaken
concept_id: matrices-and-determinants
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: matrices-and-determinants.hook
for_stance: shaken
---

A message is encoded by multiplying it by a matrix. Take $E=\begin{pmatrix}3&2\\5&4\end{pmatrix}$. The message "HI" is written as numbers $(8,9)$, since $H=8$ and $I=9$.

Multiply: $E\begin{pmatrix}8\\9\end{pmatrix}=\begin{pmatrix}3(8)+2(9)\\5(8)+4(9)\end{pmatrix}=\begin{pmatrix}42\\76\end{pmatrix}$. That is the sent message: $(42,76)$.

To read it back, the receiver needs $E^{-1}$. Check first: $\det(E)=3(4)-2(5)=12-10=2$. Since $\det(E)\neq0$, $E^{-1}$ exists, so decoding is possible. If $\det(E)$ had come out $0$ instead, no inverse would exist, and the message could never be decoded by anyone — not by the receiver, not even by the sender.
