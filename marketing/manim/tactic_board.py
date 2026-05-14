"""
tactic_board.py — 25s, 16:9 — Tablero táctico animado tipo TV
Render: manim -qh tactic_board.py TacticBoard
"""
from manim import *
import numpy as np

PITCH = "#0e7a3e"
LIME  = "#c6ff3d"
CYAN  = "#33d6e6"
RED   = "#ff3d4e"
INK   = "#0c1410"
PAPER = "#f4f3ec"


def make_pitch():
    pitch = RoundedRectangle(width=12, height=6.4, corner_radius=0.25,
                             fill_color=PITCH, fill_opacity=1,
                             stroke_color=PAPER, stroke_width=3)
    midline = Line([0, 3.2, 0], [0, -3.2, 0], color=PAPER, stroke_width=2)
    center = Circle(radius=0.8, color=PAPER, stroke_width=2)
    box_l = Rectangle(width=1.8, height=3.2, color=PAPER, stroke_width=2).move_to([-5.1, 0, 0])
    box_r = Rectangle(width=1.8, height=3.2, color=PAPER, stroke_width=2).move_to([5.1, 0, 0])
    return VGroup(pitch, midline, center, box_l, box_r)


class TacticBoard(Scene):
    def construct(self):
        self.camera.background_color = INK

        # 0–2s: intro card
        brand = VGroup(
            Text("futbolClub", font="Space Grotesk", weight=BOLD, color=LIME).scale(1.6),
            Text("tablero táctico", font="Space Grotesk", color=PAPER).scale(0.6),
        ).arrange(DOWN, buff=0.2)
        self.play(FadeIn(brand[0], shift=UP*0.3), run_time=0.6)
        self.play(Write(brand[1]), run_time=0.4)
        self.wait(0.5)
        self.play(brand.animate.scale(0.45).to_corner(UL), run_time=0.6)

        # 2–4s: pitch
        pitch_g = make_pitch()
        self.play(FadeIn(pitch_g), run_time=0.6)

        # 2–6s: place 11 vs 11
        team_a = [
            (-5.5, 0), (-3.8, -2), (-3.8, -0.7), (-3.8, 0.7), (-3.8, 2),
            (-1.8, -1.5), (-1.8, 0), (-1.8, 1.5),
            (-0.3, -1.8), (-0.3, 0), (-0.3, 1.8),
        ]
        team_b = [(-x, y) for (x, y) in team_a]

        dots_a = VGroup(*[Dot([x, y, 0], radius=0.18, color=LIME).set_stroke(INK, 2) for x, y in team_a])
        dots_b = VGroup(*[Dot([x, y, 0], radius=0.18, color=RED).set_stroke(INK, 2)  for x, y in team_b])
        self.play(LaggedStart(*[GrowFromCenter(d) for d in dots_a], lag_ratio=0.04), run_time=0.9)
        self.play(LaggedStart(*[GrowFromCenter(d) for d in dots_b], lag_ratio=0.04), run_time=0.9)

        # 6–9s: scoreboard
        score = VGroup(
            Text("NOSOTROS", font="Space Grotesk", color=LIME).scale(0.4),
            Text("0 - 0", font="JetBrains Mono", weight=BOLD, color=PAPER).scale(0.7),
            Text("RIVAL", font="Space Grotesk", color=RED).scale(0.4),
        ).arrange(RIGHT, buff=0.5).to_edge(UP).shift(DOWN*0.2)
        self.play(FadeIn(score, shift=DOWN*0.2), run_time=0.5)
        self.wait(0.4)

        # 9–14s: passing sequence with arrows (animated dashed)
        seq = [(7, 6), (6, 9), (9, 10), (10, 8)]  # indices into dots_a
        arrows = []
        for a, b in seq:
            arr = Arrow(dots_a[a].get_center(), dots_a[b].get_center(),
                        buff=0.22, color=CYAN, stroke_width=6, max_tip_length_to_length_ratio=0.18)
            arrows.append(arr)
            self.play(Create(arr), run_time=0.5)
            self.play(Indicate(dots_a[b], color=CYAN, scale_factor=1.3), run_time=0.3)

        # 14–17s: shoot to goal
        ball = Dot(dots_a[8].get_center(), radius=0.12, color=PAPER).set_stroke(INK, 2)
        self.add(ball)
        goal_target = np.array([5.7, 0.4, 0])
        path = ArcBetweenPoints(ball.get_center(), goal_target, angle=-0.6)
        self.play(MoveAlongPath(ball, path), run_time=0.8, rate_func=rate_functions.ease_in_quad)

        # ⚽ flash + score update
        flash = Circle(radius=0.4, color=LIME).move_to(goal_target)
        self.play(FadeIn(flash, scale=2), FadeOut(flash, scale=0.5), run_time=0.4)
        new_score = Text("1 - 0", font="JetBrains Mono", weight=BOLD, color=LIME).scale(0.7).move_to(score[1])
        self.play(Transform(score[1], new_score), run_time=0.4)
        gol = Text("¡GOL!", font="Space Grotesk", weight=BOLD, color=LIME).scale(2.2)
        self.play(FadeIn(gol, scale=0.8), run_time=0.3)
        self.play(FadeOut(gol, scale=1.4), run_time=0.4)

        # 17–22s: cleanup + tagline
        self.play(*[FadeOut(a) for a in arrows], FadeOut(ball), run_time=0.4)

        tagline = Text("Armá tu equipo. Compartí la formación.",
                       font="Space Grotesk", color=PAPER).scale(0.6).to_edge(DOWN).shift(UP*0.4)
        self.play(Write(tagline), run_time=1.0)
        self.wait(0.6)

        # 22–25s: CTA
        cta_bg = RoundedRectangle(width=6, height=1.1, corner_radius=0.55,
                                  fill_color=LIME, fill_opacity=1, stroke_width=0).move_to([0, -2.0, 0])
        cta_tx = Text("⚽  futbolClub.html", font="Space Grotesk", weight=BOLD, color=INK).scale(0.6).move_to(cta_bg.get_center())
        self.play(FadeOut(tagline), GrowFromCenter(cta_bg), run_time=0.5)
        self.play(Write(cta_tx), run_time=0.5)
        self.play(cta_bg.animate.scale(1.04), cta_tx.animate.scale(1.04), rate_func=there_and_back, run_time=1.0)
        self.wait(0.4)
