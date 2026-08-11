# Teaching Tips: Complex Numbers

## Common Student Errors
- **Forgetting that $i^2 = -1$**: When expanding $(a+bi)(c+di)$, students often write $bdi^2 = bd$ instead of $-bd$. Always expand FOIL carefully: $(a+bi)(c+di) = ac + adi + bci + bdi^2 = (ac - bd) + (ad+bc)i$.
- **Incorrect modulus formula**: Many students compute $|a + bi| = a + b$ instead of $\sqrt{a^2 + b^2}$. Visualize: the modulus is the Euclidean distance from the origin to the point $(a,b)$ in the complex plane.
- **Mixing up $z$ and $\bar{z}$ in products**: $z \cdot \bar{z} = |z|^2$ is a critical identity, but students often forget it or confuse it with $z + \bar{z} = 2 \cdot \text{Re}(z)$.

## GATE Question Pattern
GATE typically asks for modulus/argument conversions, De Moivre's theorem applications (especially for high powers and roots), or algebraic division of complex numbers. A common trap: asking for the argument when the result is on a negative axis (e.g., $-3 + 0i$ has argument $\pi$, not $0$ or $2\pi$).

## Speed Tricks for MCQs
- **Use polar form for powers/roots**: $(re^{i\theta})^n = r^n e^{in\theta}$ is much faster than repeated multiplication. For example, computing $(1+i)^{100}$ algebraically is tedious; in polar form it's immediate.
- **Recognize $|z|^2 = z \cdot \bar{z}$**: Instead of computing $|a+bi| = \sqrt{a^2+b^2}$, multiply: $(a+bi)(a-bi) = a^2 + b^2$, then take the square root.
- **Rationalize via conjugate**: To divide $\frac{a+bi}{c+di}$, always multiply top and bottom by the conjugate $c - di$. The denominator becomes $c^2 + d^2$ (a real number), eliminating complex arithmetic in the denominator.

## Must-Memorize Formulas / Results
- **Euler's formula**: $e^{i\theta} = \cos\theta + i\sin\theta$
- **De Moivre's Theorem**: $(re^{i\theta})^n = r^n e^{in\theta} = r^n(\cos(n\theta) + i\sin(n\theta))$
- **Modulus of a product**: $|z_1 z_2| = |z_1| \cdot |z_2|$
- **Modulus of a quotient**: $\left|\frac{z_1}{z_2}\right| = \frac{|z_1|}{|z_2|}$
- **Key identity**: $z \cdot \bar{z} = |z|^2 = x^2 + y^2$ (for $z = x + iy$)
- **Sum of cube roots of unity**: $1 + \omega + \omega^2 = 0$ (where $\omega = e^{2\pi i/3}$)
- **Nth root formula**: The $n$ complex $n$-th roots of $re^{i\theta}$ are $r^{1/n} e^{i(\theta + 2\pi k)/n}$ for $k = 0, 1, \ldots, n-1$.
