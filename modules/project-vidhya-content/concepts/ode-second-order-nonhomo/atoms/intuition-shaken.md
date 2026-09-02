---
# for_stance: shaken — one concrete polynomial-forcing example, full arithmetic, explicit check.
id: ode-second-order-nonhomo.intuition.shaken
concept_id: ode-second-order-nonhomo
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: ode-second-order-nonhomo.intuition
for_stance: shaken
---

$y''-y=x^2$. First step: since $f(x)=x^2$ is a degree-2 polynomial and not a homogeneous solution ($r=\pm1$ gives $e^{x},e^{-x}$, no polynomials), try $y_p=Ax^2+Bx+C$.

Then $y_p''=2A$. Substitute:
$$2A-(Ax^2+Bx+C)=x^2 \;\Longrightarrow\; -Ax^2-Bx+(2A-C)=x^2$$

Match coefficients: $-A=1\Rightarrow A=-1$; $-B=0\Rightarrow B=0$; $2A-C=0\Rightarrow C=2A=-2$.

$$y_p=-x^2-2$$

Check: $y_p''-y_p=-2-(-x^2-2)=x^2$ — matches the right-hand side exactly.
