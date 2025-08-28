#!/usr/bin/env python3
"""
Platform Analysis Module for Game Jam Analysis (Version 2)

This module analyzes game platforms across different game jams:
- Platform distribution and popularity
- Platform performance correlation
- Cross-platform game analysis
- Platform trends over time
- Interactive web-based visualizations
"""

import plotly.graph_objects as go
import plotly.express as px
import plotly.subplots as sp
from plotly.subplots import make_subplots
import numpy as np
import pandas as pd
from sqlmodel import Session, select
from typing import List, Optional, Dict, Tuple
from models import JamGame, Game, GameJam
import os
from collections import Counter, defaultdict

class PlatformAnalyzerV2:
    def __init__(self, session: Session):
        self.session = session
        self.output_dir = "jam_analysis_outputs"
        os.makedirs(self.output_dir, exist_ok=True)
        
    def analyze_jam_platforms(self, jam_id: int, jam_name: str = None):
        """Analyze platforms for a specific game jam"""
        # Get jam games with their associated games
        statement = select(JamGame).where(JamGame.gamejam_id == jam_id)
        jam_games = self.session.exec(statement).all()
        
        if not jam_games:
            print(f"No games found for jam ID {jam_id}")
            return
            
        # Get platform data for each jam game
        platform_data = []
        for jam_game in jam_games:
            if jam_game.game and jam_game.game.platforms:
                platforms = self._parse_platforms(jam_game.game.platforms)
                for platform in platforms:
                    platform_data.append({
                        'platform': platform,
                        'score': jam_game.score,
                        'rank': jam_game.rank,
                        'rating_count': jam_game.rating_count,
                        'raw_score': jam_game.raw_score,
                    })
        
        if not platform_data:
            print("No platform data found for this jam")
            return
            
        jam_name = jam_name or f"Jam {jam_id}"
        
        # Create separate, focused visualizations
        self._create_platform_distribution_chart(platform_data, jam_name)
        self._create_platform_performance_chart(platform_data, jam_name)
        self._create_platform_strategy_chart(jam_games, jam_name)
        self._create_platform_correlation_chart(platform_data, jam_name)
        
    def analyze_all_platforms(self):
        """Analyze platforms across all game jams"""
        # Get all games with platforms
        statement = select(Game).where(Game.platforms.is_not(None))
        games = self.session.exec(statement).all()
        
        if not games:
            print("No games with platform data found")
            return
            
        # Collect platform data
        platform_counts = Counter()
        for game in games:
            if game.platforms:
                platforms = self._parse_platforms(game.platforms)
                for platform in platforms:
                    platform_counts[platform] += 1
                    
        self._create_global_platform_chart(platform_counts)
        
    def _parse_platforms(self, platforms_str: str) -> List[str]:
        """Parse platform string into list of individual platforms"""
        if not platforms_str:
            return []
        
        # Split by comma and clean up
        platforms = [p.strip().lower() for p in platforms_str.split(',') if p.strip()]
        
        # Normalize platform names
        normalized = []
        for platform in platforms:
            if 'windows' in platform or 'win' in platform:
                normalized.append('Windows')
            elif 'mac' in platform or 'osx' in platform:
                normalized.append('macOS')
            elif 'linux' in platform:
                normalized.append('Linux')
            elif 'web' in platform or 'html5' in platform or 'browser' in platform:
                normalized.append('Web')
            elif 'android' in platform:
                normalized.append('Android')
            elif 'ios' in platform or 'iphone' in platform:
                normalized.append('iOS')
            elif 'switch' in platform or 'nintendo' in platform:
                normalized.append('Nintendo Switch')
            elif 'ps' in platform or 'playstation' in platform:
                normalized.append('PlayStation')
            elif 'xbox' in platform:
                normalized.append('Xbox')
            else:
                normalized.append(platform.title())
                
        return list(set(normalized))  # Remove duplicates
        
    def _create_platform_distribution_chart(self, platform_data: List[Dict], jam_name: str):
        """Create platform distribution chart"""
        # Count platforms
        platform_counts = Counter([item['platform'] for item in platform_data])
        
        if not platform_counts:
            print("No platform data for distribution chart")
            return
        
        # Create pie chart
        fig = go.Figure(data=[go.Pie(
            labels=list(platform_counts.keys()),
            values=list(platform_counts.values()),
            hole=0.3,
            textinfo='label+percent',
            textposition='outside'
        )])
        
        fig.update_layout(
            title=f'Platform Distribution - {jam_name}',
            showlegend=True,
            height=600,
            width=800
        )
        
        # Save as HTML and PNG
        html_path = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_platform_distribution.html")
        png_path = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_platform_distribution.png")
        
        fig.write_html(html_path)
        fig.write_image(png_path, width=800, height=600)
        
        fig.show()
        print(f"Platform distribution chart saved to {html_path} and {png_path}")
        
    def _create_platform_performance_chart(self, platform_data: List[Dict], jam_name: str):
        """Create platform performance analysis chart"""
        # Group data by platform
        platform_stats = defaultdict(lambda: {'scores': [], 'ranks': [], 'ratings': []})
        for item in platform_data:
            platform = item['platform']
            if item['score'] is not None:
                platform_stats[platform]['scores'].append(item['score'])
            if item['rank'] is not None:
                platform_stats[platform]['ranks'].append(item['rank'])
            if item['rating_count'] is not None:
                platform_stats[platform]['ratings'].append(item['rating_count'])
        
        # Calculate statistics for each platform
        platform_performance = {}
        for platform, data in platform_stats.items():
            if data['scores']:
                platform_performance[platform] = {
                    'avg_score': np.mean(data['scores']),
                    'avg_rank': np.mean(data['ranks']) if data['ranks'] else None,
                    'avg_ratings': np.mean(data['ratings']) if data['ratings'] else None,
                    'count': len(data['scores'])
                }
        
        if not platform_performance:
            print("No performance data available for platforms")
            return
        
        # Create performance comparison chart
        platforms = list(platform_performance.keys())
        avg_scores = [platform_performance[p]['avg_score'] for p in platforms]
        counts = [platform_performance[p]['count'] for p in platforms]
        
        # Create subplot with performance and popularity
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Average Score by Platform', 'Platform Popularity vs Performance', 
                          'Score Distribution by Platform', 'Rating Count by Platform'),
            specs=[[{"type": "bar"}, {"type": "scatter"}],
                   [{"type": "box"}, {"type": "box"}]]
        )
        
        # Average score by platform
        fig.add_trace(
            go.Bar(x=platforms, y=avg_scores, name='Average Score', 
                   marker_color='lightgreen', showlegend=False),
            row=1, col=1
        )
        
        # Platform popularity vs performance
        fig.add_trace(
            go.Scatter(x=counts, y=avg_scores, mode='markers+text',
                      text=platforms, textposition="top center",
                      marker=dict(size=12, color='purple'),
                      name='Platforms', showlegend=False),
            row=1, col=2
        )
        
        # Score distribution by platform
        for platform in platforms:
            scores = platform_stats[platform]['scores']
            if scores:
                fig.add_trace(
                    go.Box(y=scores, name=platform, showlegend=False),
                    row=2, col=1
                )
        
        # Rating count by platform
        for platform in platforms:
            ratings = platform_stats[platform]['ratings']
            if ratings:
                fig.add_trace(
                    go.Box(y=ratings, name=platform, showlegend=False),
                    row=2, col=2
                )
        
        fig.update_layout(
            title=f'Platform Performance Analysis - {jam_name}',
            height=800,
            width=1200,
            showlegend=False
        )
        
        fig.update_xaxes(title_text="Platform", row=1, col=1)
        fig.update_yaxes(title_text="Average Score", row=1, col=1)
        fig.update_xaxes(title_text="Number of Games", row=1, col=2)
        fig.update_yaxes(title_text="Average Score", row=1, col=2)
        fig.update_xaxes(title_text="Platform", row=2, col=1)
        fig.update_yaxes(title_text="Score", row=2, col=1)
        fig.update_xaxes(title_text="Platform", row=2, col=2)
        fig.update_yaxes(title_text="Number of Ratings", row=2, col=2)
        
        # Save as HTML and PNG
        html_path = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_platform_performance.html")
        png_path = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_platform_performance.png")
        
        fig.write_html(html_path)
        fig.write_image(png_path, width=1200, height=800)
        
        fig.show()
        print(f"Platform performance chart saved to {html_path} and {png_path}")
        
    def _create_platform_strategy_chart(self, jam_games: List[JamGame], jam_name: str):
        """Create platform strategy analysis chart"""
        # Count platforms per actual game
        game_platform_counts = {}
        for jam_game in jam_games:
            if jam_game.game and jam_game.game.platforms:
                platforms = self._parse_platforms(jam_game.game.platforms)
                game_platform_counts[jam_game.game.title] = len(platforms)
        
        if not game_platform_counts:
            print("No platform strategy data available")
            return
        
        # Categorize games by platform count
        platform_categories = defaultdict(int)
        for count in game_platform_counts.values():
            if count == 1:
                platform_categories['Single Platform'] += 1
            elif count == 2:
                platform_categories['2 Platforms'] += 1
            elif count == 3:
                platform_categories['3 Platforms'] += 1
            else:
                platform_categories[f'{count}+ Platforms'] += 1
        
        # Create pie chart
        fig = go.Figure(data=[go.Pie(
            labels=list(platform_categories.keys()),
            values=list(platform_categories.values()),
            hole=0.3,
            textinfo='label+percent+value',
            textposition='outside'
        )])
        
        fig.update_layout(
            title=f'Platform Strategy - {jam_name}',
            showlegend=True,
            height=600,
            width=800
        )
        
        # Save as HTML and PNG
        html_path = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_platform_strategy.html")
        png_path = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_platform_strategy.png")
        
        fig.write_html(html_path)
        fig.write_image(png_path, width=800, height=600)
        
        fig.show()
        print(f"Platform strategy chart saved to {html_path} and {png_path}")
        
    def _create_platform_correlation_chart(self, platform_data: List[Dict], jam_name: str):
        """Create platform correlation analysis chart"""
        # Create correlation matrix for platform metrics
        platform_metrics = defaultdict(lambda: {'scores': [], 'ranks': [], 'ratings': []})
        for item in platform_data:
            platform = item['platform']
            if item['score'] is not None:
                platform_metrics[platform]['scores'].append(item['score'])
            if item['rank'] is not None:
                platform_metrics[platform]['ranks'].append(item['rank'])
            if item['rating_count'] is not None:
                platform_metrics[platform]['ratings'].append(item['rating_count'])
        
        # Calculate correlations
        correlations = []
        platforms = list(platform_metrics.keys())
        
        for i, platform1 in enumerate(platforms):
            for j, platform2 in enumerate(platforms):
                if i < j:  # Avoid duplicate pairs
                    scores1 = platform_metrics[platform1]['scores']
                    scores2 = platform_metrics[platform2]['scores']
                    
                    if len(scores1) > 1 and len(scores2) > 1:
                        # Calculate correlation between platform scores
                        correlation = np.corrcoef(scores1, scores2)[0, 1]
                        if not np.isnan(correlation):
                            correlations.append({
                                'platform1': platform1,
                                'platform2': platform2,
                                'correlation': correlation
                            })
        
        if not correlations:
            print("No correlation data available")
            return
        
        # Sort by absolute correlation
        correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)
        
        # Create correlation chart
        fig = go.Figure(data=[
            go.Bar(
                x=[f"{c['platform1']} vs {c['platform2']}" for c in correlations[:10]],
                y=[c['correlation'] for c in correlations[:10]],
                marker_color=['red' if x < 0 else 'blue' for x in [c['correlation'] for c in correlations[:10]]],
                text=[f'{c["correlation"]:.3f}' for c in correlations[:10]],
                textposition='outside'
            )
        ])
        
        fig.update_layout(
            title=f'Top Platform Correlations - {jam_name}',
            xaxis_title='Platform Pairs',
            yaxis_title='Correlation Coefficient',
            height=600,
            width=1000,
            showlegend=False
        )
        
        # Add horizontal line at y=0
        fig.add_hline(y=0, line_dash="dash", line_color="black")
        
        # Save as HTML and PNG
        html_path = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_platform_correlations.html")
        png_path = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_platform_correlations.png")
        
        fig.write_html(html_path)
        fig.write_image(png_path, width=1000, height=600)
        
        fig.show()
        print(f"Platform correlations chart saved to {html_path} and {png_path}")
        
    def _create_global_platform_chart(self, platform_counts: Counter):
        """Create global platform distribution chart"""
        if not platform_counts:
            print("No global platform data available")
            return
        
        # Get top platforms
        top_platforms = platform_counts.most_common(15)
        platforms, counts = zip(*top_platforms)
        
        # Create horizontal bar chart
        fig = go.Figure(data=[
            go.Bar(
                y=platforms,
                x=counts,
                orientation='h',
                marker_color='steelblue',
                text=counts,
                textposition='auto'
            )
        ])
        
        fig.update_layout(
            title='Global Platform Distribution (All Game Jams)',
            xaxis_title='Number of Games',
            yaxis_title='Platform',
            height=800,
            width=1000,
            showlegend=False
        )
        
        # Save as HTML and PNG
        html_path = os.path.join(self.output_dir, "global_platform_distribution.html")
        png_path = os.path.join(self.output_dir, "global_platform_distribution.png")
        
        fig.write_html(html_path)
        fig.write_image(png_path, width=1000, height=800)
        
        fig.show()
        print(f"Global platform distribution saved to {html_path} and {png_path}")

def main():
    """Example usage of the PlatformAnalyzerV2"""
    from models import get_session
    
    # Get a session
    session = next(get_session())
    
    # Create analyzer
    analyzer = PlatformAnalyzerV2(session)
    
    # Example: Analyze platforms for a specific jam
    # analyzer.analyze_jam_platforms(jam_id=1, jam_name="Example Jam")
    
    # Example: Analyze all platforms globally
    # analyzer.analyze_all_platforms()
    
    print("PlatformAnalyzerV2 created. Use analyze_jam_platforms() or analyze_all_platforms() methods.")

if __name__ == "__main__":
    main() 