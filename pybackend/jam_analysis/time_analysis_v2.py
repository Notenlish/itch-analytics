#!/usr/bin/env python3
"""
Time Analysis Module (V2 - Plotly)

- Jam timeline and phase durations
- Submission timing relative to start
- Daily submission rate
- Time-of-day performance effects
- Exports HTML and PNG
"""

import os
from typing import List
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from sqlmodel import Session, select
from collections import defaultdict, Counter
from models import JamGame, GameJam

class TimeAnalyzerV2:
    def __init__(self, session: Session):
        self.session = session
        self.output_dir = "jam_analysis_outputs"
        os.makedirs(self.output_dir, exist_ok=True)

    def analyze_jam_timing(self, jam_id: int, jam_name: str | None = None):
        jam = self.session.exec(select(GameJam).where(GameJam.id == jam_id)).first()
        if not jam:
            print(f"Jam with ID {jam_id} not found")
            return
        jam_games = self.session.exec(select(JamGame).where(JamGame.gamejam_id == jam_id)).all()
        if not jam_games:
            print(f"No games found for jam ID {jam_id}")
            return

        jam_name = jam_name or jam.title

        # 1) Jam timeline (bar for phases)
        dev_days = (jam.end_date - jam.start_date).days
        vot_days = (jam.voting_end_date - jam.end_date).days
        fig = go.Figure()
        fig.add_trace(go.Bar(x=["Development", "Voting"], y=[dev_days, vot_days], marker_color=["lightblue", "lightcoral"]))
        fig.update_layout(title=f"Jam Phase Durations - {jam_name}", yaxis_title="Days", height=500, width=800)
        html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_phase_durations.html")
        png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_phase_durations.png")
        fig.write_html(html); fig.write_image(png, width=800, height=500); fig.show(); print(f"Saved {html} and {png}")

        # 2) Submission timing (hours from start)
        times = []
        for g in jam_games:
            if g.created_at:
                times.append((g.created_at - jam.start_date).total_seconds() / 3600.0)
        if times:
            fig = go.Figure(go.Histogram(x=times, nbinsx=24, marker_color="lightgreen"))
            fig.update_layout(title=f"Submission Timing (hours from start) - {jam_name}", xaxis_title="Hours", yaxis_title="Submissions",
                              height=500, width=900)
            html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_submission_timing.html")
            png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_submission_timing.png")
            fig.write_html(html); fig.write_image(png, width=900, height=500); fig.show(); print(f"Saved {html} and {png}")

        # 3) Daily submission rate
        daily = defaultdict(int)
        for g in jam_games:
            if g.created_at:
                daily[g.created_at.date()] += 1
        if daily:
            xs = sorted(daily.keys()); ys = [daily[x] for x in xs]
            fig = go.Figure(go.Scatter(x=xs, y=ys, mode="lines+markers"))
            fig.update_layout(title=f"Daily Submission Rate - {jam_name}", xaxis_title="Date", yaxis_title="Submissions",
                              height=500, width=900)
            html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_daily_submission_rate.html")
            png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_daily_submission_rate.png")
            fig.write_html(html); fig.write_image(png, width=900, height=500); fig.show(); print(f"Saved {html} and {png}")

        # 4) Time-of-day performance (hour vs score)
        hour_scores = defaultdict(list)
        for g in jam_games:
            if g.created_at and g.score is not None:
                hour_scores[g.created_at.hour].append(g.score)
        if hour_scores:
            hours = sorted(hour_scores.keys()); avgs = [float(np.mean(hour_scores[h])) for h in hours]
            fig = go.Figure(go.Bar(x=hours, y=avgs, marker_color="mediumpurple"))
            fig.update_layout(title=f"Average Score by Hour of Submission - {jam_name}", xaxis_title="Hour (0-23)", yaxis_title="Average Score",
                              height=500, width=900)
            html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_score_by_hour.html")
            png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_score_by_hour.png")
            fig.write_html(html); fig.write_image(png, width=900, height=500); fig.show(); print(f"Saved {html} and {png}")


def main():
    from models import get_session
    session = next(get_session())
    analyzer = TimeAnalyzerV2(session)
    # analyzer.analyze_jam_timing(jam_id=1, jam_name="Example Jam")
    print("TimeAnalyzerV2 ready. Use analyze_jam_timing().")

if __name__ == "__main__":
    main() 