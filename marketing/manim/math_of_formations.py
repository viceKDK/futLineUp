"""
math_of_formations.py — 15s, 16:9 — "La matemática del 9"
Render: manim -qh math_of_formations.py MathOfFormations
"""
from manim import *

PITCH   = "#0e7a3e"
LIME    = "#c6ff3d"
CYAN    = "#33d6e6"
RED     = "#ff3d4e"
INK     = "#0c1410"
PAPER   = "#f4f3ec"


class MathOfFormations(Scene):
    def construct(self):
        self.camera.background_color = INK

        # ----- 0–2s: title -----
        title = Text("La matemática", font="Space Grotesk", weight=BOLD, color=PAPER).scale(0.9)
        title2 = Text("del 9", font="Space Grotesk", weight=BOLD, color=LIME).scale(1.6)
        title2.next_to(title, DOWN, buff=0.3)
        grp = VGroup(title, title2).move_to(ORIGIN)
        self.play(FadeIn(title, shift=UP*0.3), run_time=0.6)
        self.play(Write(title2), run_time=0.7)
        self.wait(0.4)
        self.play(grp.animate.to_edge(UP).scale(0.55), run_time=0.5)

        # ----- 2–6s: pitch + 4-4-2 -----
        pitch = RoundedRectangle(width=11, height=5, corner_radius=0.2, fill_color=PITCH, fill_opacity=1, stroke_color=PAPER, stroke_width=3)
        midline = Line(pitch.get_top(), pitch.get_bottom(), color=PAPER).set_stroke(width=2)
        circle = Circle(radius=0.6, color=PAPER).set_stroke(width=2)
        pitch_g = VGroup(pitch, midline, circle).shift(DOWN*0.3)
        self.play(FadeIn(pitch_g), run_time=0.5)

        # 4-4-2 left side coords (we mirror right)
        coords_442 = [
            (-4.8, 0),                # GK
            (-3.2, -1.6), (-3.2, -0.5), (-3.2, 0.5), (-3.2, 1.6),  # DEF
            (-1.4, -1.6), (-1.4, -0.5), (-1.4, 0.5), (-1.4, 1.6),  # MID
            (0.2, -0.7), (0.2, 0.7),                                # FW
        ]
        dots = VGroup(*[
            Dot([x, y - 0.3, 0], radius=0.18, color=LIME).set_stroke(INK, 2)
            for x, y in coords_442
        ])
        self.play(LaggedStart(*[GrowFromCenter(d) for d in dots], lag_ratio=0.05), run_time=1.2)
        label = Text("4 - 4 - 2", font="JetBrains Mono", color=CYAN).scale(0.9).to_edge(DOWN).shift(UP*0.4)
        self.play(Write(label), run_time=0.4)
        self.wait(0.6)

        # ----- 6–10s: triangles between midfield+forwards -----
        formula = MathTex(r"\triangle_{\text{pase}} = \binom{n}{3}", color=PAPER).to_corner(UR).shift(DOWN*0.2 + LEFT*0.2)
        self.play(Write(formula), run_time=0.5)

        triangle_idx = [(5,6,9), (6,7,9), (7,8,10), (6,9,10)]
        tris = VGroup(*[
            Polygon(
                dots[a].get_center(), dots[b].get_center(), dots[c].get_center(),
                color=CYAN, fill_color=CYAN, fill_opacity=0.18, stroke_width=2,
            ) for a,b,c in triangle_idx
        ])
        self.play(LaggedStart(*[Create(t) for t in tris], lag_ratio=0.2), run_time=1.2)
        self.wait(0.6)

        # ----- 10–13s: morph to 4-3-3 -----
        coords_433 = [
            (-4.8, 0),
            (-3.2, -1.6), (-3.2, -0.5), (-3.2, 0.5), (-3.2, 1.6),
            (-1.4, -1.0), (-1.4, 0), (-1.4, 1.0),
            (0.6, -1.5), (0.6, 0), (0.6, 1.5),
        ]
        targets = [Dot([x, y - 0.3, 0], radius=0.18, color=LIME) for x, y in coords_433]
        new_label = Text("4 - 3 - 3", font="JetBrains Mono", color=RED).scale(0.9).move_to(label)
        self.play(
            *[d.animate.move_to(t.get_center()) for d, t in zip(dots, targets)],
            FadeOut(tris),
            Transform(label, new_label),
            run_time=1.4,
        )
        self.wait(0.4)

        # ----- 13–15s: CTA -----
        cta = VGroup(
            Text("futbolClub", font="Space Grotesk", weight=BOLD, color=LIME).scale(0.9),
            Text("armá la tuya", font="Space Grotesk", color=PAPER).scale(0.5),
        ).arrange(DOWN, buff=0.15).to_corner(DL).shift(UP*0.2 + RIGHT*0.2)
        self.play(FadeIn(cta, shift=UP*0.2), run_time=0.6)
        self.wait(0.6)
