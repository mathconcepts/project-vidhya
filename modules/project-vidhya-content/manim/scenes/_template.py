"""
Template for a Vidhya Manim scene.

Copy this file to `<concept-id>-<topic>.py`, rename the class to anything
descriptive, and implement `construct()`. The build script picks up the
first class that subclasses `manim.Scene` automatically.

`CAPTION_LINES` is a list of `(start_seconds, end_seconds, text)` tuples
the build script converts into a sibling .vtt file. Captions are mandatory
— skipping them ships an inaccessible video.
"""

from manim import Scene, Tex, MathTex, Axes, Create, Write, FadeIn, Transform, FadeOut, BLUE, config
from manim import Square, NumberPlane

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from theme import BG, PRIMARY, SECONDARY, AXES, TEXT  # noqa: E402

config.background_color = BG


class TemplateScene(Scene):
    CAPTION_LINES = [
        (0.0, 3.0, "Replace this caption with your real script line."),
        (3.0, 8.0, "Each tuple is (start, end, text) in seconds."),
    ]

    def construct(self):
        title = Tex("Replace me", color=TEXT)
        self.play(Write(title))
        self.wait(1.5)

        plane = NumberPlane(
            x_range=[-3, 3, 1],
            y_range=[-3, 3, 1],
            background_line_style={"stroke_color": AXES, "stroke_opacity": 0.4},
        )
        self.play(FadeOut(title), Create(plane), run_time=1.5)

        # Curve example — paste your real geometry here.
        graph = plane.plot(lambda x: 0.5 * x ** 2 - 1, color=PRIMARY)
        label = MathTex("y = \\tfrac{1}{2}x^2 - 1", color=PRIMARY).next_to(graph, "UP")
        self.play(Create(graph), FadeIn(label))
        self.wait(2)
