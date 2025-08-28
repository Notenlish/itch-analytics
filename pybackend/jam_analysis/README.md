# Game Jam Analysis Toolkit

A comprehensive Python toolkit for analyzing game jam data from itch.io, providing detailed insights into scoring, platforms, teams, criteria, timing, and engagement patterns.

## Features

### 📊 Analysis Modules

1. **Score Analysis** (`score_analysis.py`)
   - Score distributions and histograms
   - Ranking analysis and correlations
   - Score vs rating count relationships
   - Raw vs final score comparisons

2. **Platform Analysis** (`platform_analysis.py`)
   - Platform distribution across jams
   - Platform performance correlation
   - Cross-platform game analysis
   - Global platform trends

3. **Team Analysis** (`team_analysis.py`)
   - Team size distribution and performance
   - Solo vs team game comparisons
   - Contributor count analysis
   - Team efficiency metrics

4. **Criteria Analysis** (`criteria_analysis.py`)
   - Individual criteria performance
   - Criteria correlations and relationships
   - Criteria vs overall score analysis
   - Performance consistency metrics

5. **Time Analysis** (`time_analysis.py`)
   - Submission timing patterns
   - Jam duration analysis
   - Development vs voting phase analysis
   - Temporal performance correlations

6. **Engagement Analysis** (`engagement_analysis.py`)
   - Rating count analysis
   - Comment patterns and engagement
   - Download statistics and trends
   - Engagement vs performance correlation

### 🎯 Key Capabilities

- **Comprehensive Visualizations**: Multiple chart types (histograms, scatter plots, box plots, heatmaps)
- **Statistical Analysis**: Correlations, distributions, quartiles, and trend analysis
- **Flexible Output**: Both interactive matplotlib displays and high-quality PNG exports
- **Jam-Specific & Global Analysis**: Analyze individual jams or patterns across all jams
- **Data-Driven Insights**: Performance correlations, efficiency metrics, and trend identification

## Installation

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Database Setup**: Ensure your SQLite database is properly configured with the models from `models.py`

## Usage

### Command Line Interface

The main analyzer provides a unified interface for all analysis types:

```bash
# List available game jams
python main_analyzer.py --list-jams

# List available analysis types
python main_analyzer.py --list-types

# Run all analyses for a specific jam
python main_analyzer.py --jam 1

# Run specific analysis types for a jam
python main_analyzer.py --jam 1 --types score,platform,team

# Run global analysis across all jams
python main_analyzer.py --global --types platform,team

# Custom jam name
python main_analyzer.py --jam 1 --jam-name "My Awesome Jam"
```

### Programmatic Usage

```python
from main_analyzer import MainAnalyzer

# Initialize analyzer
analyzer = MainAnalyzer()

# Analyze a specific jam
analyzer.analyze_jam(jam_id=1, analysis_types=['score', 'platform'])

# Run global analysis
analyzer.analyze_all_jams(analysis_types=['team', 'engagement'])

# List available jams
analyzer.list_available_jams()
```

### Individual Module Usage

```python
from score_analysis import ScoreAnalyzer
from models import get_session

# Get database session
session = next(get_session())

# Create score analyzer
score_analyzer = ScoreAnalyzer(session)

# Analyze scores for a specific jam
score_analyzer.analyze_jam_scores(jam_id=1, jam_name="Example Jam")
```

## Output

All analyses generate:
- **Interactive matplotlib visualizations** (displayed in real-time)
- **High-quality PNG exports** (saved to `jam_analysis_outputs/` directory)
- **Comprehensive statistics** and correlation data
- **Performance insights** and trend analysis

## Analysis Types

### Score Analysis
- **Distribution Analysis**: Histograms, box plots, cumulative distributions
- **Ranking Analysis**: Rank vs score, top performers, rank distribution
- **Correlation Analysis**: Score vs rating count, raw vs final scores
- **Statistical Summary**: Mean, median, standard deviation, quartiles

### Platform Analysis
- **Platform Distribution**: Pie charts, bar charts, platform counts
- **Performance Analysis**: Score by platform, platform popularity vs performance
- **Cross-Platform Analysis**: Single vs multi-platform game analysis
- **Global Trends**: Platform distribution across all jams

### Team Analysis
- **Team Size Distribution**: Solo vs team games, team size counts
- **Performance Correlation**: Team size vs score, team efficiency
- **Comparative Analysis**: Solo vs team performance, team size categories
- **Efficiency Metrics**: Score per person, team performance trends

### Criteria Analysis
- **Individual Criteria**: Score distributions, performance by criteria
- **Correlation Matrix**: Inter-criteria relationships, correlation heatmaps
- **Overall Comparison**: Criteria vs overall score, consistency analysis
- **Performance Summary**: Top criteria, correlation strengths

### Time Analysis
- **Jam Timeline**: Start/end dates, development vs voting phases
- **Submission Patterns**: Timing distribution, daily submission rates
- **Performance Correlation**: Submission timing vs score
- **Global Trends**: Jam duration patterns, temporal analysis

### Engagement Analysis
- **Rating Analysis**: Rating count distribution, rating vs performance
- **Comment Analysis**: Comment patterns, engagement categories
- **Download Analysis**: Download counts, size vs performance
- **Overall Engagement**: Combined engagement metrics, efficiency analysis

## Data Requirements

The analysis modules expect the following data structure from your `models.py`:

- **GameJam**: Jam metadata (dates, entry counts, etc.)
- **JamGame**: Individual game submissions with scores, ranks, and criteria
- **Game**: Game details including platforms, contributors, and assets
- **Criteria**: Individual scoring criteria and performance
- **User**: Creator information and contributor relationships
- **Comments**: User feedback and engagement metrics
- **DownloadItems**: Game assets and download statistics

## Customization

Each analysis module can be extended with:
- **Custom visualization styles** (colors, themes, layouts)
- **Additional statistical measures** (custom correlations, metrics)
- **Export formats** (PDF, SVG, interactive HTML)
- **Filtering options** (date ranges, score thresholds, etc.)

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure your database path is correct in `models.py`
2. **Missing Dependencies**: Install all required packages from `requirements.txt`
3. **Data Availability**: Some analyses require specific data fields to be populated
4. **Memory Usage**: Large datasets may require increased memory allocation

### Performance Tips

- **Filter Data**: Use specific jam IDs for focused analysis
- **Batch Processing**: Run global analyses during off-peak hours
- **Memory Management**: Close matplotlib figures after analysis completion

## Contributing

To extend the analysis toolkit:

1. **Add New Analysis Types**: Create new modules following the existing pattern
2. **Enhance Visualizations**: Improve chart aesthetics and interactivity
3. **Optimize Performance**: Implement efficient data processing for large datasets
4. **Add Export Options**: Support additional output formats and configurations

## License

This toolkit is designed for educational and research purposes. Please ensure compliance with itch.io's terms of service when using their data.

## Support

For questions or issues:
1. Check the troubleshooting section above
2. Review the individual module documentation
3. Examine the example usage patterns in each module's `main()` function
4. Verify your database schema matches the expected model structure

---

**Happy Analyzing! 🎮📊** 