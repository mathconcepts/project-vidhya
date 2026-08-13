---
id: continuous-distributions-visual-analogy
concept_id: continuous-distributions
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Human Heights and the Bell Curve

Stand at the gate of a large university and measure the heights of 10,000 students as they walk in.

## The Pattern You See

Plot the counts as a histogram — use 5 cm bins. The bars form a shape:

- **Symmetric** around 170 cm (the mean $\mu$)
- **Tallest in the middle**, tapering to nearly zero at both extremes
- **Bell-shaped**

This is the normal distribution $N(170, 7^2)$ — mean 170 cm, standard deviation 7 cm.

## The PDF Is a Smoothed Histogram

As you shrink the bin width toward zero, the histogram melts into a smooth curve — the PDF. The area of any bar equals the probability of a height in that interval.

$$P(163 < X < 177) = P\!\left(\frac{163-170}{7} < Z < \frac{177-170}{7}\right) = P(-1 < Z < 1) \approx 0.68$$

68% of students fall within one standard deviation of the mean. That's the 68–95–99.7 rule seen in the histogram.

## Standardization = Rescaling the Ruler

Measuring in raw cm versus in "standard deviations from the mean" gives the same shape. $Z = \frac{X - 170}{7}$ shifts the ruler so 0 is at the mean and 1 unit = 1 standard deviation. Every normal question reduces to the $Z$ table this way.

## Exponential: Waiting for the Next Student

Now stand at the door and watch for students wearing a specific team jersey. They arrive at random, average 3 per hour — a Poisson process with $\lambda = 3\,\text{hr}^{-1}$.

The **waiting time** $W$ between arrivals follows $\text{Exp}(\lambda = 3)$:

$$E[W] = \frac{1}{3}\,\text{hr} = 20\,\text{min}$$

The PDF decays exponentially — short waits are most common, very long waits are rare. The **memoryless** property means: if you've already waited 10 minutes, the distribution of remaining wait time is exactly the same as at the start. Past waiting does not "owe" you a shorter future wait.

## Uniform: The Random Lecture Start

A professor always starts between 9:00 and 9:10 — completely at random, any minute equally likely. This is $U(0, 10)$ in minutes:

$$f(t) = \frac{1}{10}, \quad 0 \leq t \leq 10$$

$$P(\text{starts before 9:04}) = \frac{4}{10} = 0.4$$

The PDF is a flat rectangle — equal probability everywhere in the interval. Area = probability, and total area = 1.

## Chi-Squared: Variance Under the Microscope

Take any single standard-normal measurement $Z$ and square it. The result $Z^2$ follows $\chi^2_1$. Sum $k$ such independent squared normals and you get $\chi^2_k$ — the workhorse for testing whether a sample variance matches a claimed population variance.

Concretely: when you compute the sample variance $S^2$ from $n$ normal observations, $\frac{(n-1)S^2}{\sigma^2} \sim \chi^2_{n-1}$. The chi-squared distribution is what the sample variance naturally lives on.

**All continuous distributions answer the same question: over what shape does probability flow when an outcome is real-valued?**
