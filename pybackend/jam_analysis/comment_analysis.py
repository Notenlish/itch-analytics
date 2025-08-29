from models import MetadataEntry, User, JamGame, Game, GameJam, GameComment, JamComment
import os
from sqlmodel import Session, select, func
from plotly import graph_objs as go
import numpy as np


class CommentAnalyzer:
    def __init__(self, session: Session):
        self.session = session
        self.output_dir = "jam_analysis_outputs"
        os.makedirs(self.output_dir, exist_ok=True)

    def analyze_comments(self, jam_id: int, jam_name: str):
        self.analyze_given_ratings_vs_rating_counts(jam_id, jam_name)
        self.analyze_given_ratings_received_comments(jam_id, jam_name)
        self.analyze_given_comments_received_comments(jam_id, jam_name)
        self.analyze_given_comments_rating_counts(jam_id, jam_name)

    def analyze_given_ratings_vs_rating_counts(self, jam_id: int, jam_name: str):
        jamgames = self.session.exec(
            select(JamGame).where(JamGame.gamejam_id == jam_id)
        ).all()

        x_vals = [jg.coolness for jg in jamgames]
        y_vals = [jg.rating_count for jg in jamgames]

        # Fit regression
        m, b = np.polyfit(x_vals, y_vals, 1)
        y_pred = m * np.array(x_vals) + b

        # Residuals
        residuals = np.array(y_vals) - y_pred
        resid_std = np.std(residuals)

        # Mark outliers as points too far from regression line
        outlier_mask = np.abs(residuals) > 3 * resid_std

        x_normal = [x for x, o in zip(x_vals, outlier_mask) if not o]
        y_normal = [y for y, o in zip(y_vals, outlier_mask) if not o]

        x_outliers = [x for x, o in zip(x_vals, outlier_mask) if o]
        y_outliers = [y for y, o in zip(y_vals, outlier_mask) if o]

        fig = go.Figure()

        # normal points
        fig.add_trace(
            go.Scatter(
                x=x_normal,
                y=y_normal,
                mode="markers",
                marker=dict(
                    size=8,
                    color="blue",
                    # colorscale="turbo",
                    # color=y_vals,
                    showscale=True,
                ),
            )
        )

        # outliers
        fig.add_trace(
            go.Scatter(
                x=x_outliers,
                y=y_outliers,
                mode="markers",
                marker=dict(size=10, color="#102e42", symbol="x"),
                name="Outliers",
            )
        )

        # Add trend line
        z = np.polyfit(x_vals, y_vals, 1)
        p = np.poly1d(z)

        # Generate smooth line across x-range
        x_line = np.linspace(min(x_vals), max(x_vals), 100)
        y_line = p(x_line)

        fig.add_trace(
            go.Scatter(
                x=x_line,
                y=y_line,
                mode="lines",
                line=dict(color="red", dash="dash"),
                name=f"Trend: y={z[0]:.3f}x+{z[1]:.3f}",
            )
        )
        correlation = np.corrcoef(x_vals, y_vals)[0, 1]

        # Add correlation annotation
        fig.add_annotation(
            xref="paper",
            yref="paper",  # place relative to the whole chart
            x=0.05,
            y=0.95,  # top-left corner (0..1 coordinates)
            text=f"r = {correlation:.2f}",
            showarrow=False,
            font=dict(size=12, color="black", family="Arial"),
            bgcolor="white",
            bordercolor="black",
            borderwidth=1,
            borderpad=4,
        )

        fig.update_layout(
            title="Given Ratings vs Received Ratings",
            xaxis=dict(
                title="Given Ratings (Coolness)",
                tick0=0,  # where ticks start
                dtick=30,  # step size for x-axis (change as needed)
                range=[-5, max(x_vals) + 20],  # force starting at 0
            ),
            yaxis=dict(
                title="Received Ratings",
                tick0=0,  # start at 0
                dtick=30,  # step size
                range=[-5, max(y_vals) + 20],  # force starting at 0
            ),
        )

        png_path = os.path.join(
            self.output_dir,
            f"{jam_name.replace(' ', '_')}_given_ratings_vs_received_ratings.png",
        )

        fig.write_image(png_path)
        fig.show()

    def analyze_given_ratings_received_comments(self, jam_id: int, jam_name: str):
        """Analyzes given ratings of a jamgame vs its received comments(JamComment)"""
        jamgames = self.session.exec(
            select(JamGame).where(JamGame.gamejam_id == jam_id)
        ).all()

        x_vals = [jg.coolness for jg in jamgames]
        y_vals = [len(jg.comments) for jg in jamgames]

        # Fit regression line
        m, b = np.polyfit(x_vals, y_vals, 1)
        y_pred = m * np.array(x_vals) + b

        # Residuals and outliers
        residuals = np.array(y_vals) - y_pred
        resid_std = np.std(residuals)
        outlier_mask = np.abs(residuals) > 3 * resid_std

        x_normal = [x for x, o in zip(x_vals, outlier_mask) if not o]
        y_normal = [y for y, o in zip(y_vals, outlier_mask) if not o]
        x_outliers = [x for x, o in zip(x_vals, outlier_mask) if o]
        y_outliers = [y for y, o in zip(y_vals, outlier_mask) if o]

        fig = go.Figure()

        # Normal points
        fig.add_trace(
            go.Scatter(
                x=x_normal,
                y=y_normal,
                mode="markers",
                marker=dict(size=8, color="blue"),
                name="Normal",
            )
        )

        # Outliers
        fig.add_trace(
            go.Scatter(
                x=x_outliers,
                y=y_outliers,
                mode="markers",
                marker=dict(size=10, color="#102e42", symbol="x"),
                name="Outliers",
            )
        )

        # Trend line
        z = np.polyfit(x_vals, y_vals, 1)
        p = np.poly1d(z)
        x_line = np.linspace(min(x_vals), max(x_vals), 100)
        y_line = p(x_line)
        fig.add_trace(
            go.Scatter(
                x=x_line,
                y=y_line,
                mode="lines",
                line=dict(color="red", dash="dash"),
                name=f"Trend: y={z[0]:.3f}x+{z[1]:.3f}",
            )
        )

        # Correlation
        correlation = np.corrcoef(x_vals, y_vals)[0, 1]
        fig.add_annotation(
            xref="paper",
            yref="paper",
            x=0.05,
            y=0.95,
            text=f"r = {correlation:.2f}",
            showarrow=False,
            font=dict(size=12, color="black", family="Arial"),
            bgcolor="white",
            bordercolor="black",
            borderwidth=1,
            borderpad=4,
        )

        fig.update_layout(
            title="Given Ratings vs Received Comments",
            xaxis=dict(
                title="Given Ratings (Coolness)",
                tick0=0,
                dtick=15,
                range=[-20, max(x_vals) + 20],
            ),
            yaxis=dict(
                title="Number of Received Comments",
                tick0=0,
                dtick=50,
                range=[-20, max(y_vals) + 20],
            ),
        )

        # Save to file
        png_path = os.path.join(
            self.output_dir,
            f"{jam_name.replace(' ', '_')}_given_ratings_vs_received_comments.png",
        )
        fig.write_image(png_path)
        fig.show()

    def analyze_given_comments_received_comments(self, jam_id: int, jam_name: str):
        # Count given comments per user in this jam
        given_counts = dict(
            self.session.exec(
                select(JamComment.author_id, func.count(JamComment.id))
                .join(JamGame, JamComment.jamgame_id == JamGame.id)
                .where(JamGame.gamejam_id == jam_id)
                .group_by(JamComment.author_id)
            ).all()
        )

        # Count received comments per jamgame in this jam
        received_counts = dict(
            self.session.exec(
                select(JamGame.id, func.count(JamComment.id))
                .join(JamComment, JamComment.jamgame_id == JamGame.id, isouter=True)
                .where(JamGame.gamejam_id == jam_id)
                .group_by(JamGame.id)
            ).all()
        )

        # Get owners and their jamgames
        games = self.session.exec(
            select(JamGame, User)
            .join(User, JamGame.user_id == User.id)
            .where(JamGame.gamejam_id == jam_id)
        ).all()

        x_vals, y_vals = [], []
        for jamgame, owner in games:
            x_vals.append(given_counts.get(owner.id, 0))
            y_vals.append(received_counts.get(jamgame.id, 0))

        # Fit regression line
        m, b = np.polyfit(x_vals, y_vals, 1)
        y_pred = m * np.array(x_vals) + b

        # Residuals and outliers
        residuals = np.array(y_vals) - y_pred
        resid_std = np.std(residuals)
        outlier_mask = np.abs(residuals) > 3 * resid_std

        x_normal = [x for x, o in zip(x_vals, outlier_mask) if not o]
        y_normal = [y for y, o in zip(y_vals, outlier_mask) if not o]
        x_outliers = [x for x, o in zip(x_vals, outlier_mask) if o]
        y_outliers = [y for y, o in zip(y_vals, outlier_mask) if o]

        fig = go.Figure()

        # Normal points
        fig.add_trace(
            go.Scatter(
                x=x_normal,
                y=y_normal,
                mode="markers",
                marker=dict(size=8, color="blue"),
                name="Normal",
            )
        )

        # Outliers
        fig.add_trace(
            go.Scatter(
                x=x_outliers,
                y=y_outliers,
                mode="markers",
                marker=dict(size=10, color="#102e42", symbol="x"),
                name="Outliers",
            )
        )

        # Trend line
        z = np.polyfit(x_vals, y_vals, 1)
        p = np.poly1d(z)
        x_line = np.linspace(min(x_vals), max(x_vals), 100)
        y_line = p(x_line)
        fig.add_trace(
            go.Scatter(
                x=x_line,
                y=y_line,
                mode="lines",
                line=dict(color="red", dash="dash"),
                name=f"Trend: y={z[0]:.3f}x+{z[1]:.3f}",
            )
        )

        # Correlation
        correlation = np.corrcoef(x_vals, y_vals)[0, 1]
        fig.add_annotation(
            xref="paper",
            yref="paper",
            x=0.05,
            y=0.95,
            text=f"r = {correlation:.2f}",
            showarrow=False,
            font=dict(size=12, color="black", family="Arial"),
            bgcolor="white",
            bordercolor="black",
            borderwidth=1,
            borderpad=4,
        )

        fig.update_layout(
            title="Given Comments vs Received Comments",
            xaxis=dict(
                title="Given Comments",
                tick0=0,
                dtick=15,
                range=[-20, max(x_vals) + 20],
            ),
            yaxis=dict(
                title="Number of Received Comments",
                tick0=0,
                dtick=50,
                range=[-20, max(y_vals) + 20],
            ),
        )

        # Save to file
        png_path = os.path.join(
            self.output_dir,
            f"{jam_name.replace(' ', '_')}_given_comments_vs_received_comments.png",
        )
        fig.write_image(png_path)
        fig.show()

    def analyze_given_comments_rating_counts(self, jam_id: int, jam_name: str):
        given_comment_counts = dict(
            self.session.exec(
                select(JamComment.author_id, func.count(JamComment.id))
                .join(JamGame, JamComment.jamgame_id == JamGame.id)
                .where(JamGame.gamejam_id == jam_id)
                .group_by(JamComment.author_id)
            ).all()
        )

        # Count how many ratings each game received (using JamGame.rating_count)
        rating_counts = dict(
            self.session.exec(
                select(JamGame.id, JamGame.rating_count).where(
                    JamGame.gamejam_id == jam_id
                )
            ).all()
        )

        games = self.session.exec(
            select(JamGame, User)
            .join(User, JamGame.user_id == User.id)
            .where(JamGame.gamejam_id == jam_id)
        ).all()

        x_vals, y_vals = [], []
        for jamgame, owner in games:
            x_vals.append(given_comment_counts.get(owner.id, 0))
            y_vals.append(rating_counts.get(jamgame.id, 0))

        # Fit regression line
        m, b = np.polyfit(x_vals, y_vals, 1)
        y_pred = m * np.array(x_vals) + b

        # Residuals and outliers
        residuals = np.array(y_vals) - y_pred
        resid_std = np.std(residuals)
        outlier_mask = np.abs(residuals) > 3 * resid_std

        x_normal = [x for x, o in zip(x_vals, outlier_mask) if not o]
        y_normal = [y for y, o in zip(y_vals, outlier_mask) if not o]
        x_outliers = [x for x, o in zip(x_vals, outlier_mask) if o]
        y_outliers = [y for y, o in zip(y_vals, outlier_mask) if o]

        fig = go.Figure()

        # Normal points
        fig.add_trace(
            go.Scatter(
                x=x_normal,
                y=y_normal,
                mode="markers",
                marker=dict(size=8, color="blue"),
                name="Normal",
            )
        )

        # Outliers
        fig.add_trace(
            go.Scatter(
                x=x_outliers,
                y=y_outliers,
                mode="markers",
                marker=dict(size=10, color="#102e42", symbol="x"),
                name="Outliers",
            )
        )

        # Trend line
        z = np.polyfit(x_vals, y_vals, 1)
        p = np.poly1d(z)
        x_line = np.linspace(min(x_vals), max(x_vals), 100)
        y_line = p(x_line)
        fig.add_trace(
            go.Scatter(
                x=x_line,
                y=y_line,
                mode="lines",
                line=dict(color="red", dash="dash"),
                name=f"Trend: y={z[0]:.3f}x+{z[1]:.3f}",
            )
        )

        # Correlation
        correlation = np.corrcoef(x_vals, y_vals)[0, 1]
        fig.add_annotation(
            xref="paper",
            yref="paper",
            x=0.05,
            y=0.95,
            text=f"r = {correlation:.2f}",
            showarrow=False,
            font=dict(size=12, color="black", family="Arial"),
            bgcolor="white",
            bordercolor="black",
            borderwidth=1,
            borderpad=4,
        )

        fig.update_layout(
            title="Given Comments vs Received Ratings",
            xaxis=dict(
                title="Given Comments",
                tick0=0,
                dtick=15,
                range=[-20, max(x_vals) + 20],
            ),
            yaxis=dict(
                title="Number of Received Ratings",
                tick0=0,
                dtick=50,
                range=[-20, max(y_vals) + 20],
            ),
        )

        # Save to file
        png_path = os.path.join(
            self.output_dir,
            f"{jam_name.replace(' ', '_')}_given_comments_vs_received_ratings.png",
        )
        fig.write_image(png_path)
        fig.show()
