# Teaching Tips: Numerical Integration

## Common Student Errors

- **Forgetting the multiplier in composite rules**: Students write "Simpson's rule is $\frac{h}{3}[f_0 + 4f_1 + 2f_2 + \ldots]$" but forget that the 4 and 2 coefficients are for *composite* (repeated) Simpson. For a single application on two subintervals, it's just $\frac{h}{3}[f_0 + 4f_1 + f_2]$. Forgetting this costs an easy 2 marks.
- **Confusing subintervals with nodes**: If $n$ is the number of subintervals, there are $n+1$ nodes. A question says "divide into 4 subintervals" — students mistakenly use 4 nodes instead of 5, getting the wrong $h$.
- **Arithmetic slips in weighted sums**: Simpson's weights are $[1, 4, 2, 4, 2, \ldots, 2, 4, 1]$ (ends are 1, middles alternate 4 and 2). A single weight mistake (writing 2 instead of 4, or vice versa) propagates through the entire answer.

## GATE Question Pattern

Numerical integration dominates GATE's numerical methods segment. Three patterns appear: (1) **Direct application**: "Use Simpson's 1/3 rule with $n = 4$ to approximate [integral]". These are arithmetic drills. (2) **Error comparison**: "Which rule gives smaller error for the same number of subintervals?" (Answer: Simpson's 1/3 vs. trapezoidal). (3) **Subinterval count**: "Find minimum $n$ such that error $< \epsilon$" using the error formula. The third type is harder and tests conceptual understanding.

## Speed Tricks for MCQs

- **Direct formula memorization**: Memorize the first few Simpson coefficients: $\frac{h}{3}[f_0 + 4f_1 + 2f_2 + 4f_3 + 2f_4 + \ldots]$. Recognizing the pattern instantly saves writing time.
- **Quick error check for degree of precision**: Simpson's 1/3 is exact for cubics ($f^{(4)} = 0$ everywhere). If the question asks "error in Simpson for a cubic?", answer is instantly 0 without any calculation.
- **Error scaling with subintervals**: Trapezoidal error scales as $O(1/n^2)$. Simpson error scales as $O(1/n^4)$. Doubling $n$ reduces trapezoidal error by 1/4; Simpson error by 1/16. Use this to estimate: if error is 0.01 with $n=4$, then with $n=8$, Simpson error $\approx 0.01/16 \approx 6 \times 10^{-4}$.

## Must-Memorize Formulas / Results

- **Trapezoidal rule (single)**: $I \\approx \\frac{h}{2}[f(x_0) + f(x_1)]$ where $h = x_1 - x_0$
- **Composite trapezoidal rule**: $I \\approx \\frac{h}{2}[f(x_0) + 2\\sum_{i=1}^{n-1} f(x_i) + f(x_n)]$, where $h = \\frac{b-a}{n}$
- **Simpson's 1/3 rule (single)**: $I \\approx \\frac{h}{3}[f(x_0) + 4f(x_1) + f(x_2)]$ where $h = \\frac{x_2 - x_0}{2}$ (requires 3 points, even spacing)
- **Composite Simpson's 1/3 rule**: $I \\approx \\frac{h}{3}[f(x_0) + 4(f(x_1) + f(x_3) + \\ldots) + 2(f(x_2) + f(x_4) + \\ldots) + f(x_n)]$ where $n$ is even
- **Simpson's 3/8 rule**: $I \\approx \\frac{3h}{8}[f(x_0) + 3f(x_1) + 3f(x_2) + f(x_3)]$ (requires 4 points)
- **Trapezoidal error**: $E \\leq \\frac{(b-a)^3}{12n^2} M_2$ where $M_2 = \\max |f''(x)|$
- **Simpson's 1/3 error**: $E \\leq \\frac{(b-a)^5}{180n^4} M_4$ where $M_4 = \\max |f^{(4)}(x)|$
- **Degree of precision**: Trapezoidal = 1, Simpson 1/3 = 3, Simpson 3/8 = 3, Boole = 5
