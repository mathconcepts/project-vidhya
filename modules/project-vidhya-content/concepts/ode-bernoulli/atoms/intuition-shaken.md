---
# Alternative body for ode-bernoulli-intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: ode-bernoulli.intuition.shaken
concept_id: ode-bernoulli
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: ode-bernoulli-intuition
for_stance: shaken
---

## The one example

Look at $\dfrac{dy}{dx} - y = xy^2$. Drop the $xy^2$ term and you'd have $\dfrac{dy}{dx} - y = 0$, an equation you already know. That extra $y^2$ is the entire obstacle.

Divide the whole equation by $y^2$:

$$y^{-2}\dfrac{dy}{dx} - y^{-1} = x$$

Now give the awkward piece a name: $v = y^{-1}$. Differentiating, $\dfrac{dv}{dx} = -y^{-2}\dfrac{dy}{dx}$, so $y^{-2}\dfrac{dy}{dx} = -\dfrac{dv}{dx}$.

Substitute that in:

$$-\dfrac{dv}{dx} - v = x \quad\Longrightarrow\quad \dfrac{dv}{dx} + v = -x$$

Every $y$ is gone. What's left is a plain linear equation in $v$ — solvable with an integrating factor, no new tricks.

## The pattern behind it

For any $\dfrac{dy}{dx} + Py = Qy^n$ with $n \neq 0, 1$: divide by $y^n$, name $v = y^{1-n}$, and the leftover equation in $v$ is always linear. Once $v(x)$ is found, undo the swap: $y = v^{1/(1-n)}$.

One thing to note before dividing: this step assumes $y \neq 0$. If $y \equiv 0$ also satisfies the original equation, it's a separate solution that division quietly hides.
