#!/usr/bin/env python3
"""
Team Analysis Module (V2 - Plotly)

- Team size distribution & solo vs team
- Score/ratings vs team size
- Efficiency metrics (score per person)
- Exports HTML and PNG
"""

import os
from typing import List, Dict
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from sqlmodel import Session, select
from collections import Counter, defaultdict
from models import JamGame, Game, GameContributorLink

class TeamAnalyzerV2:
    def __init__(self, session: Session):
        self.session = session
        self.output_dir = "jam_analysis_outputs"
        os.makedirs(self.output_dir, exist_ok=True)

    def _team_size(self, game: Game) -> int:
        if not game:
            return 1
        contributors = set()
        if game.user and game.user.id is not None:
            contributors.add(game.user.id)
        if game.contributors:
            for c in game.contributors:
                if c.id is not None:
                    contributors.add(c.id)
        return max(1, len(contributors))

    def analyze_jam_teams(self, jam_id: int, jam_name: str | None = None):
        statement = select(JamGame).where(JamGame.gamejam_id == jam_id)
        jam_games = self.session.exec(statement).all()
        if not jam_games:
            print(f"No games found for jam ID {jam_id}")
            return

        jam_name = jam_name or f"Jam {jam_id}"

        team_data: List[Dict] = []
        for jg in jam_games:
            if jg.game:
                size = self._team_size(jg.game)
                team_data.append({
                    "team_size": size,
                    "score": jg.score,
                    "rank": jg.rank,
                    "rating_count": jg.rating_count,
                    "title": jg.title,
                })
        if not team_data:
            print("No team data")
            return

        # 1) Team size distribution
        sizes = [d["team_size"] for d in team_data]
        counts = Counter(sizes)
        fig = go.Figure(go.Bar(x=[f"{s}" for s in sorted(counts.keys())], y=[counts[s] for s in sorted(counts.keys())],
                               marker_color="lightblue"))
        fig.update_layout(title=f"Team Size Distribution - {jam_name}", xaxis_title="Team Size", yaxis_title="Games",
                          height=500, width=900)
        html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_team_size_distribution.html")
        png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_team_size_distribution.png")
        fig.write_html(html); fig.write_image(png, width=900, height=500); fig.show(); print(f"Saved {html} and {png}")

        # 2) Solo vs Team
        solo = sum(1 for s in sizes if s == 1)
        team = sum(1 for s in sizes if s > 1)
        fig = go.Figure(go.Pie(labels=["Solo", "Team"], values=[solo, team], hole=0.3, textinfo="label+percent+value"))
        fig.update_layout(title=f"Solo vs Team - {jam_name}", height=500, width=700)
        html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_solo_vs_team.html")
        png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_solo_vs_team.png")
        fig.write_html(html); fig.write_image(png, width=700, height=500); fig.show(); print(f"Saved {html} and {png}")

        # 3) Score vs team size
        valid = [(d["team_size"], d["score"]) for d in team_data if d["score"] is not None]
        if valid:
            ts, sc = zip(*valid)
            fig = go.Figure(go.Scatter(x=ts, y=sc, mode="markers", marker=dict(size=8, color=sc, colorscale="Viridis", showscale=True)))
            z = np.polyfit(ts, sc, 1); p = np.poly1d(z); xs = np.linspace(min(ts), max(ts), 100)
            fig.add_trace(go.Scatter(x=xs, y=p(xs), mode="lines", line=dict(color="red", dash="dash"), name=f"Trend y={z[0]:.3f}x+{z[1]:.3f}"))
            r = np.corrcoef(ts, sc)[0, 1]
            fig.update_layout(title=f"Team Size vs Score - {jam_name} (r={r:.3f})", xaxis_title="Team Size", yaxis_title="Score",
                              height=600, width=900)
            html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_team_size_vs_score.html")
            png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_team_size_vs_score.png")
            fig.write_html(html); fig.write_image(png, width=900, height=600); fig.show(); print(f"Saved {html} and {png}")

        # 4) Rating count vs team size
        valid = [(d["team_size"], d["rating_count"]) for d in team_data if d["rating_count"] is not None]
        if valid:
            ts, rc = zip(*valid)
            fig = go.Figure(go.Box(x=[str(t) for t in ts], y=rc, boxmean=True))
            fig.update_layout(title=f"Ratings by Team Size - {jam_name}", xaxis_title="Team Size", yaxis_title="Number of Ratings",
                              height=600, width=900)
            html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_ratings_by_team_size.html")
            png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_ratings_by_team_size.png")
            fig.write_html(html); fig.write_image(png, width=900, height=600); fig.show(); print(f"Saved {html} and {png}")

        # 5) Efficiency (score per person)
        valid = [(d["team_size"], d["score"]) for d in team_data if d["score"] is not None and d["team_size"] > 0]
        if valid:
            eff = {}
            for ts, sc in valid:
                eff.setdefault(ts, []).append(sc / ts)
            xs = sorted(eff.keys()); ys = [np.mean(eff[x]) for x in xs]
            fig = go.Figure(go.Bar(x=[str(x) for x in xs], y=ys, marker_color="teal"))
            fig.update_layout(title=f"Score per Person by Team Size - {jam_name}", xaxis_title="Team Size", yaxis_title="Avg Score/Person",
                              height=500, width=900)
            html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_score_per_person.html")
            png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_score_per_person.png")
            fig.write_html(html); fig.write_image(png, width=900, height=500); fig.show(); print(f"Saved {html} and {png}")


def main():
    from models import get_session
    session = next(get_session())
    analyzer = TeamAnalyzerV2(session)
    # analyzer.analyze_jam_teams(jam_id=1, jam_name="Example Jam")
    print("TeamAnalyzerV2 ready. Use analyze_jam_teams().")

if __name__ == "__main__":
    main() 