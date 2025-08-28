#!/usr/bin/env python3
"""
Main Analyzer for Game Jam Analysis

This module provides a unified interface to run all types of analysis:
- Score analysis
- Platform analysis
- Team analysis
- Criteria analysis
- Time analysis
- Engagement analysis
"""

import argparse
from sqlmodel import Session, select
from models import get_session, GameJam

from jam_analysis.score_analysis_v2 import ScoreAnalyzerV2
from jam_analysis.platform_analysis_v2 import PlatformAnalyzerV2
from jam_analysis.team_analysis_v2 import TeamAnalyzerV2
from jam_analysis.criteria_analysis_v2 import CriteriaAnalyzerV2
from jam_analysis.time_analysis_v2 import TimeAnalyzerV2
from jam_analysis.engagement_analysis_v2 import EngagementAnalyzerV2
from jam_analysis.tags_analysis_v2 import TagsAnalyzerV2
from jam_analysis.wordcloud_analysis import WordcloudAnalyzer
from jam_analysis.comment_analysis import CommentAnalyzer


class MainAnalyzer:
    def __init__(self):
        self.session = next(get_session())
        self.analyzers = {
            "score": ScoreAnalyzerV2(self.session),
            "platform": PlatformAnalyzerV2(self.session),
            "team": TeamAnalyzerV2(self.session),
            "criteria": CriteriaAnalyzerV2(self.session),
            "time": TimeAnalyzerV2(self.session),
            "engagement": EngagementAnalyzerV2(self.session),
            "tags": TagsAnalyzerV2(self.session),
            "cloud": WordcloudAnalyzer(self.session),
            "comment": CommentAnalyzer(self.session),
        }

    def analyze_jam(
        self, jam_id: int, analysis_types: list = None, jam_name: str = None
    ):
        """Run analysis for a specific game jam"""
        # Get jam details
        jam_statement = select(GameJam).where(GameJam.id == jam_id)
        jam = self.session.exec(jam_statement).first()

        if not jam:
            print(f"Jam with ID {jam_id} not found")
            return

        jam_name = jam_name or jam.title
        print(f"Starting analysis for: {jam_name}")
        print("=" * 50)

        # Run specified analysis types or all if none specified
        if not analysis_types:
            analysis_types = list(self.analyzers.keys())

        for analysis_type in analysis_types:
            if analysis_type in self.analyzers:
                print(f"\nRunning {analysis_type.upper()} analysis...")
                try:
                    if analysis_type == "score":
                        self.analyzers[analysis_type].analyze_jam_scores(
                            jam_id, jam_name
                        )
                    elif analysis_type == "platform":
                        self.analyzers[analysis_type].analyze_jam_platforms(
                            jam_id, jam_name
                        )
                    elif analysis_type == "team":
                        self.analyzers[analysis_type].analyze_jam_teams(
                            jam_id, jam_name
                        )
                    elif analysis_type == "criteria":
                        self.analyzers[analysis_type].analyze_jam_criteria(
                            jam_id, jam_name
                        )
                    elif analysis_type == "time":
                        self.analyzers[analysis_type].analyze_jam_timing(
                            jam_id, jam_name
                        )
                    elif analysis_type == "engagement":
                        self.analyzers[analysis_type].analyze_jam_engagement(
                            jam_id, jam_name
                        )
                    elif analysis_type == "tags":
                        self.analyzers[analysis_type].analyze_jam_tags(jam_id, jam_name)
                    elif analysis_type == "cloud":
                        self.analyzers[analysis_type].analyze_wordcloud(
                            jam_id, jam_name
                        )
                    elif analysis_type == "comment":
                        self.analyzers[analysis_type].analyze_comments(jam_id, jam_name)

                    print(f"✓ {analysis_type.upper()} analysis completed")
                except Exception as e:
                    print(f"✗ Error in {analysis_type.upper()} analysis: {e}")
            else:
                print(f"✗ Unknown analysis type: {analysis_type}")

        print("\n" + "=" * 50)
        print(f"Analysis completed for: {jam_name}")
        print(f"Output files saved to: jam_analysis_outputs/")

    def analyze_all_jams(self, analysis_types: list = None):
        """Run analysis across all game jams"""
        print("Starting global analysis across all game jams...")
        print("=" * 50)

        # Run specified analysis types or all if none specified
        if not analysis_types:
            analysis_types = list(self.analyzers.keys())

        for analysis_type in analysis_types:
            if analysis_type in self.analyzers:
                print(f"\nRunning global {analysis_type.upper()} analysis...")
                try:
                    if analysis_type == "platform":
                        self.analyzers[analysis_type].analyze_all_platforms()
                    elif analysis_type == "team":
                        self.analyzers[analysis_type].analyze_all_teams()
                    elif analysis_type == "criteria":
                        self.analyzers[analysis_type].analyze_all_criteria()
                    elif analysis_type == "time":
                        self.analyzers[analysis_type].analyze_all_jams_timing()
                    elif analysis_type == "engagement":
                        self.analyzers[analysis_type].analyze_all_engagement()
                    elif analysis_type == "tags":
                        self.analyzers[analysis_type].analyze_all_tags()
                    elif analysis_type == "cloud":
                        self.analyzers[analysis_type].analyze_all_wordclouds()
                    elif analysis_type == "comments":
                        self.analyzers[analysis_type].analyze_all_comments()
                    else:
                        print(f"Global analysis not available for {analysis_type}")
                        continue

                    print(f"✓ Global {analysis_type.upper()} analysis completed")
                except Exception as e:
                    print(f"✗ Error in global {analysis_type.upper()} analysis: {e}")
            else:
                print(f"✗ Unknown analysis type: {analysis_type}")

        print("\n" + "=" * 50)
        print("Global analysis completed")
        print(f"Output files saved to: jam_analysis_outputs/")

    def list_available_jams(self):
        """List all available game jams"""
        jams = self.session.exec(select(GameJam)).all()

        if not jams:
            print("No game jams found in database")
            return

        print("Available Game Jams:")
        print("-" * 60)
        print(f"{'ID':<5} {'Title':<40} {'Entries':<8} {'Start Date':<12}")
        print("-" * 60)

        for jam in jams:
            entries = jam.entries_count or 0
            start_date = (
                jam.start_date.strftime("%Y-%m-%d") if jam.start_date else "N/A"
            )
            print(f"{jam.id:<5} {jam.title[:39]:<40} {entries:<8} {start_date:<12}")

        print("-" * 60)
        print(f"Total Jams: {len(jams)}")

    def list_analysis_types(self):
        """List all available analysis types"""
        print("Available Analysis Types:")
        print("-" * 30)

        analysis_descriptions = {
            "score": "Score distributions, rankings, and correlations",
            "platform": "Platform analysis and performance",
            "team": "Team size and composition analysis",
            "criteria": "Individual criteria performance and correlations",
            "time": "Submission timing and jam duration analysis",
            "engagement": "Comments, ratings, and download analysis",
            "tags": "Tag analysis and correlations",
            "cloud": "Wordcloud",
            "comment": "Comment Analysis",
        }

        for analysis_type, description in analysis_descriptions.items():
            print(f"{analysis_type:<12} - {description}")

        print("\nUsage Examples:")
        print("  python main_analyzer.py --jam 1 --types score,platform")
        print("  python main_analyzer.py --global --types team,engagement")
        print("  python main_analyzer.py --list-jams")
        print("  python main_analyzer.py --list-types")


def main():
    parser = argparse.ArgumentParser(description="Game Jam Analysis Tool")
    parser.add_argument("--jam", type=int, help="Jam ID to analyze")
    parser.add_argument(
        "--do-global", action="store_true", help="Run global analysis across all jams"
    )
    parser.add_argument(
        "--types", type=str, help="Comma-separated list of analysis types"
    )
    parser.add_argument(
        "--list-jams", action="store_true", help="List all available jams"
    )
    parser.add_argument(
        "--list-types", action="store_true", help="List all analysis types"
    )
    parser.add_argument(
        "--jam-name", type=str, help="Custom name for the jam (optional)"
    )

    args = parser.parse_args()
    print(args)

    analyzer = MainAnalyzer()

    if args.list_jams:
        analyzer.list_available_jams()
    elif args.list_types:
        analyzer.list_analysis_types()
    elif args.jam:
        # Parse analysis types
        analysis_types = None
        if args.types:
            analysis_types = [t.strip() for t in args.types.split(",")]

        analyzer.analyze_jam(args.jam, analysis_types, args.jam_name)
    elif args.do_global:
        # Parse analysis types
        analysis_types = None
        if args.types:
            analysis_types = [t.strip() for t in args.types.split(",")]

        analyzer.analyze_all_jams(analysis_types)
    else:
        print("Game Jam Analysis Tool")
        print("=" * 30)
        print("Use --help for usage information")
        print("\nQuick Start:")
        print("  python main_analyzer.py --list-jams")
        print("  python main_analyzer.py --jam 1")
        print("  python main_analyzer.py --do-global")


if __name__ == "__main__":
    main()
