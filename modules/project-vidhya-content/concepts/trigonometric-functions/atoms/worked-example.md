---
id: trigonometric-functions.worked-example
concept_id: trigonometric-functions
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
---

**Find the general solution of $2\sin^2\theta-\sin\theta-1=0$.**

The equation has only $\sin\theta$ in it, at two different powers — that is exactly the shape of a quadratic, just with $\sin\theta$ standing in for the usual $x$. Substitute $s=\sin\theta$ so ordinary factoring tools apply:

$$2s^2-s-1=0$$

Factor by splitting the middle term (looking for two numbers multiplying to $2\times(-1)=-2$ and adding to $-1$: those are $-2$ and $1$):

$$2s^2-2s+s-1=0 \implies 2s(s-1)+1(s-1)=0 \implies (2s+1)(s-1)=0$$

So $s=-\dfrac12$ or $s=1$, meaning $\sin\theta=-\dfrac12$ or $\sin\theta=1$.

**Case $\sin\theta=1$.** This is sine's maximum value, hit at exactly one point per turn, so it needs its own short formula rather than the general $\sin\alpha$ pattern: $\theta=2n\pi+\dfrac{\pi}{2}$, for any integer $n$.

**Case $\sin\theta=-\dfrac12$.** Write $-\dfrac12$ as $\sin\alpha$ with $\alpha=-\dfrac{\pi}{6}$ (since $\sin(-\pi/6)=-1/2$), and apply the standard formula $\theta=n\pi+(-1)^n\alpha$:

$$\theta=n\pi+(-1)^n\left(-\dfrac{\pi}{6}\right)=n\pi+(-1)^{n+1}\dfrac{\pi}{6}$$

**Full answer**:

$$\boxed{\theta=2n\pi+\dfrac{\pi}{2}\quad\text{or}\quad\theta=n\pi+(-1)^{n+1}\dfrac{\pi}{6},\ n\in\mathbb{Z}}$$

Check $n=0$ in the second family: $\theta=-\pi/6$, and $\sin(-\pi/6)=-1/2$. Correct. Check $n=1$: $\theta=\pi+\pi/6=7\pi/6$, and $\sin(7\pi/6)=-1/2$. Correct too.
