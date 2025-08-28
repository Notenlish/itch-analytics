#!/usr/bin/env python3
"""
Tags Analysis Module (V2 - Plotly)

- Parse tags from game metadata (comma-separated)
- Tag frequency
- Tags vs score, rating_count, comments
- Tags vs download items (count, total size MB, external ratio)
- Exports HTML and PNG
"""

import os
from typing import List, Dict, Tuple
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from sqlmodel import Session, select
from collections import defaultdict, Counter
from models import JamGame, Game, MetadataEntry, DownloadItem

class TagsAnalyzerV2:
    def __init__(self, session: Session):
        self.session = session
        self.output_dir = "jam_analysis_outputs"
        os.makedirs(self.output_dir, exist_ok=True)

    def _extract_tags(self, game: Game) -> List[str]:
        tags: List[str] = []
        if not game or not getattr(game, "metadata_entries", None):
            return tags
        for m in game.metadata_entries:
            key = (m.key or "").lower()
            if key in ("tags", "tag", "itch_tags", "keywords") and m.value:
                raw = m.value
                # Support common separators: comma, semicolon, pipe, newline, space after '#'
                for sep in [",", ";", "|", "\n"]:
                    raw = raw.replace(sep, ",")
                parts = [p.strip().lower() for p in raw.split(',') if p.strip()]
                tags.extend(parts)
        # dedupe normalized
        return list({t for t in tags})

    def _download_item_stats(self, game: Game) -> Tuple[int, float, float]:
        # returns (num_items, total_size_mb, external_ratio)
        if not game or not getattr(game, "download_items", None):
            return (0, 0.0, 0.0)
        items = game.download_items
        num = len(items)
        size_mb = sum((di.size or 0) for di in items) / (1024.0 * 1024.0)
        if num == 0:
            return (0, 0.0, 0.0)
        external_ratio = sum(1 for di in items if di.external) / num
        return (num, float(size_mb), float(external_ratio))

    def analyze_jam_tags(self, jam_id: int, jam_name: str | None = None):
        jam_games = self.session.exec(select(JamGame).where(JamGame.gamejam_id == jam_id)).all()
        if not jam_games:
            print(f"No games found for jam ID {jam_id}")
            return
        jam_name = jam_name or f"Jam {jam_id}"

        # Build per-game features
        game_features: List[Dict] = []
        for jg in jam_games:
            game = jg.game
            tags = self._extract_tags(game) if game else []
            comment_count = len(jg.comments) if jg.comments else 0
            num_items, size_mb, external_ratio = self._download_item_stats(game) if game else (0, 0.0, 0.0)
            game_features.append({
                "title": jg.title,
                "tags": tags,
                "score": jg.score,
                "rating_count": jg.rating_count,
                "comments": comment_count,
                "download_items_count": num_items,
                "download_items_size_mb": size_mb,
                "download_items_external_ratio": external_ratio,
            })

        # 1) Tag frequency
        all_tags = [t for row in game_features for t in row["tags"]]
        tag_counts = Counter(all_tags)
        if tag_counts:
            # Include all tags; sort by count desc
            sorted_items = tag_counts.most_common()
            tags, counts = zip(*sorted_items)
            # Horizontal bar for readability with dynamic height
            height = max(600, 20 * len(tags))
            fig = go.Figure(go.Bar(y=list(tags), x=list(counts), orientation='h', marker_color="steelblue"))
            fig.update_layout(title=f"Tag Frequency - {jam_name}", xaxis_title="Count", yaxis_title="Tag",
                              height=height, width=1100)
            html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_top_tags.html")
            png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_top_tags.png")
            fig.write_html(html); fig.write_image(png, width=1100, height=height); fig.show(); print(f"Saved {html} and {png}")

        # 2) Tag-level aggregates vs performance/engagement
        tag_aggr: Dict[str, Dict[str, List[float]]] = defaultdict(lambda: defaultdict(list))
        for row in game_features:
            for t in row["tags"]:
                if row["score"] is not None:
                    tag_aggr[t]["score"].append(float(row["score"]))
                if row["rating_count"] is not None:
                    tag_aggr[t]["rating_count"].append(float(row["rating_count"]))
                tag_aggr[t]["comments"].append(float(row["comments"]))
                tag_aggr[t]["download_items_count"].append(float(row["download_items_count"]))
                tag_aggr[t]["download_items_size_mb"].append(float(row["download_items_size_mb"]))
                tag_aggr[t]["download_items_external_ratio"].append(float(row["download_items_external_ratio"]))

        def avg_or_zero(vals: List[float]) -> float:
            return float(np.mean(vals)) if vals else 0.0

        # Build frames for some key comparisons
        metrics = [
            ("Avg Score by Tag", "score"),
            ("Avg Rating Count by Tag", "rating_count"),
            ("Avg Comments by Tag", "comments"),
            ("Avg Download Items Count by Tag", "download_items_count"),
            ("Avg Download Items Size (MB) by Tag", "download_items_size_mb"),
            ("Avg Download Items External Ratio by Tag", "download_items_external_ratio"),
        ]

        for title, key in metrics:
            rows = [(t, avg_or_zero(vals[key])) for t, vals in tag_aggr.items()]
            if not rows:
                continue
            # Include all tags; sort by value desc
            rows.sort(key=lambda x: x[1], reverse=True)
            tags = [r[0] for r in rows]
            vals = [r[1] for r in rows]
            height = max(600, 20 * len(tags))
            fig = go.Figure(go.Bar(y=tags, x=vals, orientation='h'))
            ylab = title.split(' by ')[0]
            fig.update_layout(title=f"{title} - {jam_name}", xaxis_title=ylab, yaxis_title="Tag",
                              height=height, width=1100)
            fname = title.lower().replace(' ', '_').replace('(', '').replace(')', '').replace('/', '_')
            html = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_{fname}.html")
            png = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_{fname}.png")
            fig.write_html(html); fig.write_image(png, width=1100, height=height); fig.show(); print(f"Saved {html} and {png}")


def main():
    from models import get_session
    session = next(get_session())
    analyzer = TagsAnalyzerV2(session)
    # analyzer.analyze_jam_tags(jam_id=1, jam_name="Example Jam")
    print("TagsAnalyzerV2 ready. Use analyze_jam_tags().")

if __name__ == "__main__":
    main() 