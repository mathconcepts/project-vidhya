---
id: matrices-and-determinants.hook-assured
concept_id: matrices-and-determinants
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: matrices-and-determinants.hook
for_stance: assured
---

$E=\begin{pmatrix}3&2\\5&4\end{pmatrix}$, $\det(E)=2\neq0$, so the cipher is decodable — $E^{-1}$ exists and recovers the original message exactly. Here is the sharper point: $\det(E)\neq0$ guarantees decoding is POSSIBLE — it never promises the arithmetic will be EASY. A determinant of $2$ still forces every division in $E^{-1}=\frac1{\det(E)}\text{adj}(E)$ to carry a factor of $\frac12$ — decode a message with $\det(E)=1$ instead, and every recovered number comes out a whole number, no fractions anywhere. Cryptographers deliberately pick encoding matrices with $\det(E)=\pm1$ for exactly this reason: invertibility is not enough on its own, the SIZE of the determinant decides how clean the arithmetic on the way back stays.
