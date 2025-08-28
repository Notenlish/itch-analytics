#!/usr/bin/env python3
"""
Criteria Analysis Module (V2 - Plotly)

- Criteria distribution and counts
- Score and rank distributions by criteria
- Criteria vs overall score correlations
- Top inter-criteria correlations
- Exports HTML and PNG
"""

import os
from typing import List, Dict
import numpy as np
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from sqlmodel import Session, select
from collections import defaultdict, Counter
from models import JamGame, Criteria

class CriteriaAnalyzerV2:
    def __init__(self, session: Session):
        self.session = session
        self.output_dir = "jam_analysis_outputs"
        os.makedirs(self.output_dir, exist_ok=True)

    def analyze_jam_criteria(self, jam_id: int, jam_name: str | None = None):
        jam_games = self.session.exec(select(JamGame).where(JamGame.gamejam_id == jam_id)).all()
        if not jam_games:
            print(f"No games found for jam ID {jam_id}")
            return
        jam_name = jam_name or f"Jam {jam_id}"

        # Collect criteria data rows
        rows: List[Dict] = []
        for jg in jam_games:
            if jg.criterias:
                for c in jg.criterias:
                    rows.append({
                        "criteria": c.name,
                        "criteria_score": c.score,
                        "criteria_raw": c.raw_score,
                        "criteria_rank": c.rank,
                        "overall_score": jg.score,
                        "overall_rank": jg.rank,
                        "title": jg.title,
                    })
        if not rows:
            print("No criteria data")
            return

        # 1) Criteria count and score distribution
        df = pd.DataFrame(rows)
        counts = df["criteria"].value_counts()
        fig = go.Figure(go.Bar(x=counts.index.tolist(), y=counts.values.tolist(), marker_color="lightcoral"))
        fig.update_layout(title=f"Criteria Counts - {jam_name}", xaxis_title="Criteria", yaxis_title="Scores",
                          height=600, width=1100)
        html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_criteria_counts.html")
        png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_criteria_counts.png")
        fig.write_html(html); fig.write_image(png, width=1100, height=600); fig.show(); print(f"Saved {html} and {png}")

        # 2) Score distribution by criteria (box)
        fig = go.Figure()
        for crit in sorted(df["criteria"].unique()):
            vals = df.loc[df["criteria"] == crit, "criteria_score"].dropna().tolist()
            if vals:
                fig.add_trace(go.Box(y=vals, name=crit, boxmean=True))
        fig.update_layout(title=f"Score Distribution by Criteria - {jam_name}", yaxis_title="Score",
                          height=700, width=1100)
        html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_criteria_score_distribution.html")
        png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_criteria_score_distribution.png")
        fig.write_html(html); fig.write_image(png, width=1100, height=700); fig.show(); print(f"Saved {html} and {png}")

        # 3) Criteria vs overall score correlation (bar)
        corr_map: Dict[str, float] = {}
        for crit in df["criteria"].unique():
            a = df.loc[(df["criteria"] == crit) & df["criteria_score"].notna() & df["overall_score"].notna(), "criteria_score"].astype(float).values
            b = df.loc[(df["criteria"] == crit) & df["criteria_score"].notna() & df["overall_score"].notna(), "overall_score"].astype(float).values
            if len(a) > 1 and len(b) > 1:
                r = float(np.corrcoef(a, b)[0, 1])
                if not np.isnan(r):
                    corr_map[crit] = r
        if corr_map:
            crits = list(corr_map.keys()); vals = [corr_map[c] for c in crits]
            fig = go.Figure(go.Bar(x=crits, y=vals, marker_color=["red" if v < 0 else "blue" for v in vals]))
            fig.update_layout(title=f"Criteria vs Overall Score Correlation - {jam_name}", xaxis_title="Criteria", yaxis_title="Correlation",
                              height=600, width=1100)
            fig.add_hline(y=0, line_dash="dash", line_color="black")
            html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_criteria_overall_correlation.html")
            png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_criteria_overall_correlation.png")
            fig.write_html(html); fig.write_image(png, width=1100, height=600); fig.show(); print(f"Saved {html} and {png}")

        # 4) Inter-criteria correlations (heatmap)
        # Pivot to wide format with titles as rows and criteria as columns
        pivot = df.pivot_table(index="title", columns="criteria", values="criteria_score", aggfunc="mean")
        if pivot.shape[1] >= 2:
            corr = pivot.corr()
            fig = go.Figure(data=go.Heatmap(z=corr.values, x=corr.columns, y=corr.index, colorscale="RdBu", zmid=0))
            fig.update_layout(title=f"Inter-Criteria Correlation Matrix - {jam_name}", height=800, width=1000)
            html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_criteria_correlation_matrix.html")
            png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_criteria_correlation_matrix.png")
            fig.write_html(html); fig.write_image(png, width=1000, height=800); fig.show(); print(f"Saved {html} and {png}")


def main():
    from models import get_session
    session = next(get_session())
    analyzer = CriteriaAnalyzerV2(session)
    # analyzer.analyze_jam_criteria(jam_id=1, jam_name="Example Jam")
    print("CriteriaAnalyzerV2 ready. Use analyze_jam_criteria().")

if __name__ == "__main__":
    main() 