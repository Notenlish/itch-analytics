#!/usr/bin/env python3
"""
Score Analysis Module (V2 - Plotly)

- Score distribution (hist, box, CDF)
- Score vs rating count
- Rank analysis (rank distribution, score vs rank, top N)
- Raw vs final score
- Exports HTML and PNG
"""

import os
from typing import List, Dict
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from sqlmodel import Session, select
from models import JamGame

class ScoreAnalyzerV2:
    def __init__(self, session: Session):
        self.session = session
        self.output_dir = "jam_analysis_outputs"
        os.makedirs(self.output_dir, exist_ok=True)

    def analyze_jam_scores(self, jam_id: int, jam_name: str | None = None):
        statement = select(JamGame).where(JamGame.gamejam_id == jam_id)
        jam_games = self.session.exec(statement).all()
        if not jam_games:
            print(f"No games found for jam ID {jam_id}")
            return

        jam_name = jam_name or f"Jam {jam_id}"

        scores = [g.score for g in jam_games if g.score is not None]
        raw_scores = [g.raw_score for g in jam_games if g.raw_score is not None]
        ranks = [g.rank for g in jam_games if g.rank is not None]
        rating_counts = [g.rating_count for g in jam_games if g.rating_count is not None]

        # 1) Score distribution (hist + box + CDF) in one figure as subplots
        if scores:
            fig = make_subplots(rows=2, cols=2, subplot_titles=(
                "Score Histogram", "Score Box Plot", "Cumulative Distribution", "Summary"
            ), specs=[[{"type": "histogram"}, {"type": "xy"}],
                      [{"type": "xy"}, {"type": "table"}]])

            # Histogram
            fig.add_trace(go.Histogram(x=scores, nbinsx=20, marker_color="skyblue"), row=1, col=1)

            # Box plot
            fig.add_trace(go.Box(y=scores, boxmean=True, name="Scores"), row=1, col=2)

            # CDF
            sorted_scores = np.sort(scores)
            cumulative = np.arange(1, len(sorted_scores) + 1) / len(sorted_scores)
            fig.add_trace(go.Scatter(x=sorted_scores, y=cumulative, mode="lines", name="CDF"), row=2, col=1)

            # Summary table
            summary = dict(
                Metric=["Count", "Mean", "Median", "Std", "Min", "Max"],
                Value=[len(scores), f"{np.mean(scores):.2f}", f"{np.median(scores):.2f}",
                       f"{np.std(scores):.2f}", f"{np.min(scores):.2f}", f"{np.max(scores):.2f}"]
            )
            fig.add_trace(go.Table(header=dict(values=list(summary.keys())),
                                   cells=dict(values=list(summary.values()))), row=2, col=2)

            fig.update_layout(title=f"Score Distribution - {jam_name}", height=800, width=1200)
            html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_score_distribution.html")
            png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_score_distribution.png")
            fig.write_html(html)
            fig.write_image(png, width=1200, height=800)
            fig.show()
            print(f"Saved {html} and {png}")

        # 2) Score vs Rating Count
        valid = [(s, r) for s, r in zip(scores, rating_counts) if s is not None and r is not None]
        if valid:
            svals, rvals = zip(*valid)
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=rvals, y=svals, mode="markers",
                                      marker=dict(size=8, color=svals, colorscale="Viridis", showscale=True)))
            # trend
            z = np.polyfit(rvals, svals, 1)
            p = np.poly1d(z)
            xs = np.linspace(min(rvals), max(rvals), 100)
            fig.add_trace(go.Scatter(x=xs, y=p(xs), mode="lines", line=dict(color="red", dash="dash"),
                                     name=f"Trend y={z[0]:.3f}x+{z[1]:.3f}"))
            corr = np.corrcoef(svals, rvals)[0, 1]
            fig.update_layout(title=f"Score vs Rating Count - {jam_name} (r={corr:.3f})",
                              xaxis_title="Number of Ratings", yaxis_title="Score",
                              height=600, width=900)
            html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_score_vs_ratings.html")
            png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_score_vs_ratings.png")
            fig.write_html(html)
            fig.write_image(png, width=900, height=600)
            fig.show()
            print(f"Saved {html} and {png}")

        # 3) Rank analysis
        valid_rs = [(r, s) for r, s in zip(ranks, scores) if r is not None and s is not None]
        if valid_rs:
            rks, svals = zip(*valid_rs)
            # Score vs Rank
            fig1 = go.Figure()
            fig1.add_trace(go.Scatter(x=rks, y=svals, mode="markers", marker=dict(color="orange")))
            fig1.update_layout(title=f"Score vs Rank - {jam_name}", xaxis_title="Rank", yaxis_title="Score",
                               height=500, width=800)
            html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_score_vs_rank.html")
            png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_score_vs_rank.png")
            fig1.write_html(html)
            fig1.write_image(png, width=800, height=500)
            fig1.show()
            print(f"Saved {html} and {png}")

            # Rank distribution
            fig2 = go.Figure()
            fig2.add_trace(go.Histogram(x=rks, nbinsx=min(30, max(5, len(set(rks))))))
            fig2.update_layout(title=f"Rank Distribution - {jam_name}", xaxis_title="Rank",
                               height=500, width=800)
            html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_rank_distribution.html")
            png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_rank_distribution.png")
            fig2.write_html(html)
            fig2.write_image(png, width=800, height=500)
            fig2.show()
            print(f"Saved {html} and {png}")

            # Top 10
            pairs = sorted(valid_rs, key=lambda x: x[0])[:10]
            top_ranks, top_scores = zip(*pairs)
            fig3 = go.Figure()
            fig3.add_trace(go.Bar(x=[f"#{r}" for r in top_ranks], y=top_scores, marker_color="gold"))
            fig3.update_layout(title=f"Top 10 Performers - {jam_name}", xaxis_title="Rank", yaxis_title="Score",
                               height=500, width=800)
            html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_top10_scores.html")
            png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_top10_scores.png")
            fig3.write_html(html)
            fig3.write_image(png, width=800, height=500)
            fig3.show()
            print(f"Saved {html} and {png}")

        # 4) Raw vs Final score
        valid_raw = [(r, s) for r, s in zip(raw_scores, scores) if r is not None and s is not None]
        if valid_raw:
            rraw, sfin = zip(*valid_raw)
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=rraw, y=sfin, mode="markers", marker=dict(color="green")))
            mn = min(min(rraw), min(sfin)); mx = max(max(rraw), max(sfin))
            fig.add_trace(go.Scatter(x=[mn, mx], y=[mn, mx], mode="lines", line=dict(color="red", dash="dash"), name="y=x"))
            corr = np.corrcoef(rraw, sfin)[0, 1]
            fig.update_layout(title=f"Raw vs Final Score - {jam_name} (r={corr:.3f})",
                              xaxis_title="Raw Score", yaxis_title="Final Score",
                              height=600, width=900)
            html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_raw_vs_final_score.html")
            png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_raw_vs_final_score.png")
            fig.write_html(html)
            fig.write_image(png, width=900, height=600)
            fig.show()
            print(f"Saved {html} and {png}")


def main():
    from models import get_session
    session = next(get_session())
    analyzer = ScoreAnalyzerV2(session)
    # analyzer.analyze_jam_scores(jam_id=1, jam_name="Example Jam")
    print("ScoreAnalyzerV2 ready. Use analyze_jam_scores().")

if __name__ == "__main__":
    main() 