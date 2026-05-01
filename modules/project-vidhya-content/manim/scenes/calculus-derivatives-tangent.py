"""
calculus-derivatives-tangent.py

Animation: secant line on f(x) = x² collapsing to the tangent at x = 1
as h → 0. Used by `calculus-derivatives.intuition` and
`calculus-derivatives.formal-definition` atoms.

Render:
    python build.py scenes/calculus-derivatives-tangent.py

Output:
    ../media/manim/calculus-derivatives-tangent.mp4
    ../media/manim/calculus-derivatives-tangent.vtt
"""

from manim import (
    Scene, Tex, MathTex, Axes, Create, Write, FadeIn, Transform, FadeOut,
    Line, Dot, ValueTracker, always_redraw, config,
)
import numpy as np
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from theme import BG, PRIMARY, SECONDARY, AXES, TEXT  # noqa: E402

config.background_color = BG


class TangentSlope(Scene):
    CAPTION_LINES = [
        (0.0, 3.0, "Watch the secant line collapse to the tangent."),
        (3.0, 7.5, "As h shrinks toward zero, the slope between two points becomes the slope at one point."),
        (7.5, 12.0, "That single-point slope is the derivative at x equals one."),
    ]

    def construct(self):
        # Title
        title = Tex("Tangent as the limit of secants", color=TEXT)
        title.to_edge("UP")
        self.play(Write(title))

        # Axes for f(x) = x^2 around x = 1
        axes = Axes(
            x_range=[-0.5, 3, 1], y_range=[-0.5, 5, 1],
            x_length=8, y_length=4.5,
            axis_config={"color": AXES, "stroke_opacity": 0.6},
            tips=False,
        )
        axes.next_to(title, "DOWN", buff=0.4)

        graph = axes.plot(lambda x: x ** 2, color=PRIMARY, x_range=[-0.4, 2.4])
        graph_label = MathTex("f(x) = x^2", color=PRIMARY).next_to(graph, "RIGHT")

        self.play(Create(axes), Create(graph), FadeIn(graph_label), run_time=1.5)

        x0 = 1.0
        h = ValueTracker(1.0)

        anchor = Dot(axes.coords_to_point(x0, x0 ** 2), color=SECONDARY, radius=0.07)
        moving = always_redraw(
            lambda: Dot(
                axes.coords_to_point(x0 + h.get_value(), (x0 + h.get_value()) ** 2),
                color=SECONDARY, radius=0.07,
            )
        )

        secant = always_redraw(
            lambda: Line(
                axes.coords_to_point(x0 - 0.5, (x0 ** 2) - 0.5 * (2 * x0 + h.get_value())),
                axes.coords_to_point(
                    x0 + h.get_value() + 0.5,
                    (x0 + h.get_value()) ** 2 + 0.5 * (2 * x0 + h.get_value()),
                ),
                color=SECONDARY, stroke_width=3,
            )
        )

        slope_label = always_redraw(
            lambda: MathTex(
                f"\\text{{slope}} = {(2 * x0 + h.get_value()):.2f}",
                color=SECONDARY,
            ).to_corner("UR")
        )

        self.play(FadeIn(anchor), FadeIn(moving), Create(secant), FadeIn(slope_label))
        self.wait(0.5)

        # h shrinks toward 0 — secant collapses onto the tangent.
        self.play(h.animate.set_value(0.05), run_time=4.5, rate_func=lambda t: t)
        self.wait(0.8)

        # Final tangent at x = 1 with slope 2.
        tangent_label = MathTex("f'(1) = 2", color=PRIMARY).to_corner("UR")
        self.play(Transform(slope_label, tangent_label))
        self.wait(1.5)

        self.play(*[FadeOut(m) for m in self.mobjects])
