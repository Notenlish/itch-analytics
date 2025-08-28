#!/usr/bin/env python3
"""
Engagement Analysis Module for Game Jam Analysis (Version 2)

This module analyzes user engagement metrics with improved categorization:
- Comments analysis and patterns with granular categories
- Rating counts and engagement
- Download patterns with detailed categories
- Engagement vs performance correlation
- Interactive web-based visualizations
"""

import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import numpy as np
import pandas as pd
from sqlmodel import Session, select
from typing import List, Optional, Dict, Tuple
from models import JamGame, Game, JamComment, GameComment, DownloadItem
import os
from collections import Counter, defaultdict

class EngagementAnalyzerV2:
    def __init__(self, session: Session):
        self.session = session
        self.output_dir = "jam_analysis_outputs"
        os.makedirs(self.output_dir, exist_ok=True)
        
    def analyze_jam_engagement(self, jam_id: int, jam_name: str = None):
        """Analyze engagement for a specific game jam"""
        # Get jam games
        statement = select(JamGame).where(JamGame.gamejam_id == jam_id)
        jam_games = self.session.exec(statement).all()
        
        if not jam_games:
            print(f"No games found for jam ID {jam_id}")
            return
            
        jam_name = jam_name or f"Jam {jam_id}"
        
        # Analyze different engagement metrics
        self._create_rating_engagement_chart(jam_games, jam_name)
        self._create_comment_engagement_chart(jam_games, jam_name)
        self._create_download_engagement_chart(jam_games, jam_name)
        self._create_engagement_performance_chart(jam_games, jam_name)
        
    def analyze_all_engagement(self):
        """Analyze engagement across all game jams"""
        # Get all games with engagement data
        statement = select(Game)
        games = self.session.exec(statement).all()
        
        if not games:
            print("No games found for engagement analysis")
            return
            
        self._create_global_engagement_chart(games)
        
    def _create_rating_engagement_chart(self, jam_games: List[JamGame], jam_name: str):
        """Create rating engagement analysis chart"""
        # Get rating data
        rating_data = []
        for game in jam_games:
            if game.rating_count is not None:
                rating_data.append({
                    'rating_count': game.rating_count,
                    'score': game.score,
                    'rank': game.rank,
                    'game_title': game.title
                })
        
        if not rating_data:
            print("No rating data available for this jam")
            return
        
        # Create rating count distribution chart
        rating_counts = [item['rating_count'] for item in rating_data]
        
        # Categorize rating counts more granularly
        rating_categories = defaultdict(int)
        for count in rating_counts:
            if count == 0:
                rating_categories['No Ratings'] += 1
            elif count <= 5:
                rating_categories['1-5 Ratings'] += 1
            elif count <= 15:
                rating_categories['6-15 Ratings'] += 1
            elif count <= 30:
                rating_categories['16-30 Ratings'] += 1
            elif count <= 50:
                rating_categories['31-50 Ratings'] += 1
            else:
                rating_categories['50+ Ratings'] += 1
        
        # Create pie chart for rating categories
        fig = go.Figure(data=[go.Pie(
            labels=list(rating_categories.keys()),
            values=list(rating_categories.values()),
            hole=0.3,
            textinfo='label+percent+value',
            textposition='outside'
        )])
        
        fig.update_layout(
            title=f'Rating Count Categories - {jam_name}',
            showlegend=True,
            height=600,
            width=800
        )
        
        # Save as HTML and PNG
        html_path = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_rating_categories.html")
        png_path = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_rating_categories.png")
        
        fig.write_html(html_path)
        fig.write_image(png_path, width=800, height=600)
        
        fig.show()
        print(f"Rating categories chart saved to {html_path} and {png_path}")
        
        # Create rating vs score correlation chart
        valid_rating_score = [(item['rating_count'], item['score']) 
                             for item in rating_data if item['score'] is not None]
        
        if valid_rating_score:
            ratings, scores = zip(*valid_rating_score)
            
            fig2 = go.Figure(data=[
                go.Scatter(
                    x=ratings, 
                    y=scores, 
                    mode='markers',
                    marker=dict(
                        size=8,
                        color=scores,
                        colorscale='Viridis',
                        showscale=True,
                        colorbar=dict(title="Score")
                    ),
                    text=[f"Score: {s:.2f}<br>Ratings: {r}" for s, r in zip(scores, ratings)],
                    hovertemplate='<b>%{text}</b><extra></extra>'
                )
            ])
            
            # Add trend line
            z = np.polyfit(ratings, scores, 1)
            p = np.poly1d(z)
            fig2.add_trace(
                go.Scatter(
                    x=ratings, 
                    y=p(ratings), 
                    mode='lines',
                    line=dict(color='red', dash='dash'),
                    name=f'Trend: y={z[0]:.3f}x+{z[1]:.3f}'
                )
            )
            
            correlation = np.corrcoef(ratings, scores)[0, 1]
            
            fig2.update_layout(
                title=f'Rating Count vs Score - {jam_name}<br><sub>Correlation: {correlation:.3f}</sub>',
                xaxis_title='Number of Ratings',
                yaxis_title='Score',
                height=600,
                width=800,
                showlegend=True
            )
            
            # Save as HTML and PNG
            html_path2 = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_rating_vs_score.html")
            png_path2 = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_rating_vs_score.png")
            
            fig2.write_html(html_path2)
            fig2.write_image(png_path2, width=800, height=600)
            
            fig2.show()
            print(f"Rating vs score chart saved to {html_path2} and {png_path2}")
        
    def _create_comment_engagement_chart(self, jam_games: List[JamGame], jam_name: str):
        """Create comment engagement analysis chart"""
        # Get comment data for each jam game
        comment_data = []
        for jam_game in jam_games:
            if jam_game.comments:
                comment_count = len(jam_game.comments)
                comment_data.append({
                    'comment_count': comment_count,
                    'score': jam_game.score,
                    'rank': jam_game.rank,
                    'rating_count': jam_game.rating_count,
                    'game_title': jam_game.title
                })
        
        if not comment_data:
            print("No comment data available for this jam")
            return
        
        # Create comment count distribution chart
        comment_counts = [item['comment_count'] for item in comment_data]
        
        # Categorize comment counts more granularly
        comment_categories = defaultdict(int)
        for count in comment_counts:
            if count == 0:
                comment_categories['No Comments'] += 1
            elif count == 1:
                comment_categories['1 Comment'] += 1
            elif count <= 3:
                comment_categories['2-3 Comments'] += 1
            elif count <= 6:
                comment_categories['4-6 Comments'] += 1
            elif count <= 10:
                comment_categories['7-10 Comments'] += 1
            elif count <= 20:
                comment_categories['11-20 Comments'] += 1
            else:
                comment_categories['20+ Comments'] += 1
        
        # Create pie chart for comment categories
        fig = go.Figure(data=[go.Pie(
            labels=list(comment_categories.keys()),
            values=list(comment_categories.values()),
            hole=0.3,
            textinfo='label+percent+value',
            textposition='outside'
        )])
        
        fig.update_layout(
            title=f'Comment Count Categories - {jam_name}',
            showlegend=True,
            height=600,
            width=800
        )
        
        # Save as HTML and PNG
        html_path = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_comment_categories.html")
        png_path = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_comment_categories.png")
        
        fig.write_html(html_path)
        fig.write_image(png_path, width=800, height=600)
        
        fig.show()
        print(f"Comment categories chart saved to {html_path} and {png_path}")
        
        # Create comment vs score correlation chart
        valid_comment_score = [(item['comment_count'], item['score']) 
                              for item in comment_data if item['score'] is not None]
        
        if valid_comment_score:
            comments, scores = zip(*valid_comment_score)
            
            fig2 = go.Figure(data=[
                go.Scatter(
                    x=comments, 
                    y=scores, 
                    mode='markers',
                    marker=dict(
                        size=8,
                        color=scores,
                        colorscale='Plasma',
                        showscale=True,
                        colorbar=dict(title="Score")
                    ),
                    text=[f"Score: {s:.2f}<br>Comments: {c}" for s, c in zip(scores, comments)],
                    hovertemplate='<b>%{text}</b><extra></extra>'
                )
            ])
            
            # Add trend line
            z = np.polyfit(comments, scores, 1)
            p = np.poly1d(z)
            fig2.add_trace(
                go.Scatter(
                    x=comments, 
                    y=p(comments), 
                    mode='lines',
                    line=dict(color='red', dash='dash'),
                    name=f'Trend: y={z[0]:.3f}x+{z[1]:.3f}'
                )
            )
            
            correlation = np.corrcoef(comments, scores)[0, 1]
            
            fig2.update_layout(
                title=f'Comment Count vs Score - {jam_name}<br><sub>Correlation: {correlation:.3f}</sub>',
                xaxis_title='Number of Comments',
                yaxis_title='Score',
                height=600,
                width=800,
                showlegend=True
            )
            
            # Save as HTML and PNG
            html_path2 = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_comment_vs_score.html")
            png_path2 = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_comment_vs_score.png")
            
            fig2.write_html(html_path2)
            fig2.write_image(png_path2, width=800, height=600)
            
            fig2.show()
            print(f"Comment vs score chart saved to {html_path2} and {png_path2}")
        
    def _create_download_engagement_chart(self, jam_games: List[JamGame], jam_name: str):
        """Create download engagement analysis chart"""
        # Get download data for each jam game
        download_data = []
        for jam_game in jam_games:
            if jam_game.game and jam_game.game.download_items:
                download_count = len(jam_game.game.download_items)
                total_size = sum(item.size for item in jam_game.game.download_items)
                download_data.append({
                    'download_items_count': download_count,
                    'download_items_total_size': total_size,
                    'score': jam_game.score,
                    'rank': jam_game.rank,
                    'rating_count': jam_game.rating_count,
                    'game_title': jam_game.title
                })
        
        if not download_data:
            print("No download data available for this jam")
            return
        
        # Create download count distribution chart
        download_counts = [item['download_items_count'] for item in download_data]
        
        # Categorize download counts more granularly
        download_categories = defaultdict(int)
        for count in download_counts:
            if count == 0:
                download_categories['No Download Items'] += 1
            elif count == 1:
                download_categories['1 Download Item'] += 1
            elif count <= 3:
                download_categories['2-3 Download Items'] += 1
            elif count <= 5:
                download_categories['4-5 Download Items'] += 1
            elif count <= 8:
                download_categories['6-8 Download Items'] += 1
            elif count <= 12:
                download_categories['9-12 Download Items'] += 1
            else:
                download_categories['12+ Download Items'] += 1
        
        # Create pie chart for download item categories
        fig = go.Figure(data=[go.Pie(
            labels=list(download_categories.keys()),
            values=list(download_categories.values()),
            hole=0.3,
            textinfo='label+percent+value',
            textposition='outside'
        )])
        
        fig.update_layout(
            title=f'Download Item Categories - {jam_name}',
            showlegend=True,
            height=600,
            width=800
        )
        
        # Save as HTML and PNG
        html_path = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_download_categories.html")
        png_path = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_download_categories.png")
        
        fig.write_html(html_path)
        fig.write_image(png_path, width=800, height=600)
        
        fig.show()
        print(f"Download categories chart saved to {html_path} and {png_path}")
        
        # Create download vs score correlation chart
        valid_download_score = [(item['download_items_count'], item['score']) 
                               for item in download_data if item['score'] is not None]
        
        if valid_download_score:
            download_items, scores = zip(*valid_download_score)
            
            fig2 = go.Figure(data=[
                go.Scatter(
                    x=download_items, 
                    y=scores, 
                    mode='markers',
                    marker=dict(
                        size=8,
                        color=scores,
                        colorscale='Inferno',
                        showscale=True,
                        colorbar=dict(title="Score")
                    ),
                    text=[f"Score: {s:.2f}<br>Download Items: {d}" for s, d in zip(scores, download_items)],
                    hovertemplate='<b>%{text}</b><extra></extra>'
                )
            ])
            
            # Add trend line
            z = np.polyfit(download_items, scores, 1)
            p = np.poly1d(z)
            fig2.add_trace(
                go.Scatter(
                    x=download_items, 
                    y=p(download_items), 
                    mode='lines',
                    line=dict(color='red', dash='dash'),
                    name=f'Trend: y={z[0]:.3f}x+{z[1]:.3f}'
                )
            )
            
            correlation = np.corrcoef(download_items, scores)[0, 1]
            
            fig2.update_layout(
                title=f'Download Item Count vs Score - {jam_name}<br><sub>Correlation: {correlation:.3f}</sub>',
                xaxis_title='Number of Download Items',
                yaxis_title='Score',
                height=600,
                width=800,
                showlegend=True
            )
            
            # Save as HTML and PNG
            html_path2 = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_download_vs_score.html")
            png_path2 = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_download_vs_score.png")
            
            fig2.write_html(html_path2)
            fig2.write_image(png_path2, width=800, height=600)
            
            fig2.show()
            print(f"Download vs score chart saved to {html_path2} and {png_path2}")
        
    def _create_engagement_performance_chart(self, jam_games: List[JamGame], jam_name: str):
        """Create comprehensive engagement vs performance correlation chart"""
        # Collect all engagement metrics
        engagement_data = []
        for jam_game in jam_games:
            rating_count = jam_game.rating_count or 0
            comment_count = len(jam_game.comments) if jam_game.comments else 0
            download_items_count = len(jam_game.game.download_items) if jam_game.game and jam_game.game.download_items else 0
            
            engagement_data.append({
                'rating_count': rating_count,
                'comment_count': comment_count,
                'download_items_count': download_items_count,
                'score': jam_game.score,
                'rank': jam_game.rank,
                'total_engagement': rating_count + comment_count + download_items_count
            })
        
        if not engagement_data:
            print("No engagement data available for correlation analysis")
            return
        
        # Create engagement performance correlation chart
        valid_engagement = [(item['total_engagement'], item['score']) 
                           for item in engagement_data if item['score'] is not None]
        
        if valid_engagement:
            engagements, scores = zip(*valid_engagement)
            
            fig = go.Figure(data=[
                go.Scatter(
                    x=engagements, 
                    y=scores, 
                    mode='markers',
                    marker=dict(
                        size=8,
                        color=scores,
                        colorscale='Viridis',
                        showscale=True,
                        colorbar=dict(title="Score")
                    ),
                    text=[f"Score: {s:.2f}<br>Total Engagement: {e}" for s, e in zip(scores, engagements)],
                    hovertemplate='<b>%{text}</b><extra></extra>'
                )
            ])
            
            # Add trend line
            z = np.polyfit(engagements, scores, 1)
            p = np.poly1d(z)
            fig.add_trace(
                go.Scatter(
                    x=engagements, 
                    y=p(engagements), 
                    mode='lines',
                    line=dict(color='red', dash='dash'),
                    name=f'Trend: y={z[0]:.3f}x+{z[1]:.3f}'
                )
            )
            
            correlation = np.corrcoef(engagements, scores)[0, 1]
            
            fig.update_layout(
                title=f'Total Engagement vs Score - {jam_name}<br><sub>Correlation: {correlation:.3f}</sub>',
                xaxis_title='Total Engagement (Ratings + Comments + Download Items)',
                yaxis_title='Score',
                height=600,
                width=800,
                showlegend=True
            )
            
            # Save as HTML and PNG
            html_path = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_total_engagement_vs_score.html")
            png_path = os.path.join(self.output_dir, f"{jam_name.replace(' ', '_')}_total_engagement_vs_score.png")
            
            fig.write_html(html_path)
            fig.write_image(png_path, width=800, height=600)
            
            fig.show()
            print(f"Total engagement vs score chart saved to {html_path} and {png_path}")
        
    def _create_global_engagement_chart(self, games: List[Game]):
        """Create global engagement distribution chart"""
        # Collect global engagement data
        global_engagement = {
            'ratings': [],
            'comments': [],
            'download_items': []
        }
        
        for game in games:
            # Get rating count from jam games
            if hasattr(game, 'jamgames') and game.jamgames:
                for jam_game in game.jamgames:
                    if jam_game.rating_count is not None:
                        global_engagement['ratings'].append(jam_game.rating_count)
            
            # Get comment count
            if hasattr(game, 'comments') and game.comments:
                global_engagement['comments'].append(len(game.comments))
            
            # Get download items count
            if hasattr(game, 'download_items') and game.download_items:
                global_engagement['download_items'].append(len(game.download_items))
        
        # Create subplots for each engagement type
        fig = make_subplots(
            rows=1, cols=3,
            subplot_titles=('Global Ratings Distribution', 'Global Comments Distribution', 'Global Download Items Distribution'),
            specs=[[{"type": "histogram"}, {"type": "histogram"}, {"type": "histogram"}]]
        )
        
        engagement_types = ['ratings', 'comments', 'download_items']
        colors = ['skyblue', 'lightcoral', 'lightgreen']
        
        for i, (eng_type, color) in enumerate(zip(engagement_types, colors)):
            if global_engagement[eng_type]:
                # Filter out extreme outliers for better visualization
                data = global_engagement[eng_type]
                q99 = np.percentile(data, 99)
                filtered_data = [x for x in data if x <= q99]
                
                fig.add_trace(
                    go.Histogram(
                        x=filtered_data,
                        nbinsx=20,
                        marker_color=color,
                        name=eng_type.title(),
                        showlegend=False
                    ),
                    row=1, col=i+1
                )
        
        fig.update_layout(
            title='Global Engagement Distribution (All Game Jams)',
            height=500,
            width=1500,
            showlegend=False
        )
        
        # Save as HTML and PNG
        html_path = os.path.join(self.output_dir, "global_engagement_distribution.html")
        png_path = os.path.join(self.output_dir, "global_engagement_distribution.png")
        
        fig.write_html(html_path)
        fig.write_image(png_path, width=1500, height=500)
        
        fig.show()
        print(f"Global engagement distribution saved to {html_path} and {png_path}")

def main():
    """Example usage of the EngagementAnalyzerV2"""
    from models import get_session
    
    # Get a session
    session = next(get_session())
    
    # Create analyzer
    analyzer = EngagementAnalyzerV2(session)
    
    # Example: Analyze engagement for a specific jam
    # analyzer.analyze_jam_engagement(jam_id=1, jam_name="Example Jam")
    
    # Example: Analyze all engagement globally
    # analyzer.analyze_all_engagement()
    
    print("EngagementAnalyzerV2 created. Use analyze_jam_engagement() or analyze_all_engagement() methods.")

if __name__ == "__main__":
    main() 