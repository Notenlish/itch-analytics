# Game Jam Analysis Toolkit - Version 2

## 🚀 **What's New in V2**

### **Interactive Web-Based Visualizations**
- **Plotly Integration**: All V2 modules now use Plotly for interactive, web-based charts
- **HTML Export**: Charts are saved as interactive HTML files that can be opened in any web browser
- **PNG Export**: High-quality static images for reports and presentations
- **Hover Information**: Rich tooltips and interactive elements for better data exploration

### **Improved Chart Organization**
- **Split 3x2 Grids**: Replaced cramped 3x2 layouts with focused, individual charts
- **Better Space Utilization**: Each chart now has dedicated space for clear information display
- **Focused Analysis**: Separate charts for different aspects of the same analysis type

### **Enhanced Engagement Categories**

#### **Comment Categories (V2)**
- No Comments
- 1 Comment
- 2-3 Comments
- 4-6 Comments
- 7-10 Comments
- 11-20 Comments
- 20+ Comments

#### **Download Categories (V2)**
- No Downloads
- 1 Download
- 2-3 Downloads
- 4-5 Downloads
- 6-8 Downloads
- 9-12 Downloads
- 12+ Downloads

#### **Rating Categories (V2)**
- No Ratings
- 1-5 Ratings
- 6-15 Ratings
- 16-30 Ratings
- 31-50 Ratings
- 50+ Ratings

### **Fixed Platform Strategy Analysis**
- **Correct Platform Counting**: Now properly counts platforms per game instead of per platform instance
- **Comma-Separated Parsing**: Fixed to handle platforms stored as "windows,osx,linux,web"
- **Accurate Multi-Platform Detection**: Correctly identifies single vs multi-platform games

## 📊 **V2 Modules Available**

### **Platform Analysis V2** (`platform_analysis_v2.py`)
- Platform distribution pie charts
- Performance analysis with subplots
- Platform strategy analysis (fixed)
- Platform correlation analysis
- Global platform distribution

### **Engagement Analysis V2** (`engagement_analysis_v2.py`)
- Granular rating categories
- Detailed comment categories
- Comprehensive download categories
- Engagement vs performance correlations
- Global engagement distribution

## 🔧 **Installation**

1. **Install V2 Dependencies**:
   ```bash
   pip install -r requirements_v2.txt
   ```

2. **Key New Dependencies**:
   - `plotly>=5.0.0` - Interactive web visualizations
   - `kaleido>=0.2.1` - Static image export (PNG)

## 🎯 **Usage**

### **Using V2 Main Analyzer**
```bash
# Run V2 analysis for a specific jam
python main_analyzer_v2.py --jam 1

# Run specific V2 analysis types
python main_analyzer_v2.py --jam 1 --types platform,engagement

# Global analysis with V2 modules
python main_analyzer_v2.py --global --types platform,engagement
```

### **Direct Module Usage**
```python
from platform_analysis_v2 import PlatformAnalyzerV2
from engagement_analysis_v2 import EngagementAnalyzerV2

# Initialize V2 analyzers
platform_analyzer = PlatformAnalyzerV2(session)
engagement_analyzer = EngagementAnalyzerV2(session)

# Run V2 analysis
platform_analyzer.analyze_jam_platforms(jam_id=1, jam_name="My Jam")
engagement_analyzer.analyze_jam_engagement(jam_id=1, jam_name="My Jam")
```

## 📁 **Output Files**

### **HTML Files (Interactive)**
- Open in any web browser
- Interactive zoom, pan, hover
- Export to PNG/SVG from browser
- Perfect for web sharing and presentations

### **PNG Files (Static)**
- High-resolution (800x600, 1200x800)
- Ready for reports and publications
- Consistent quality across platforms

## 🔄 **Migration from V1**

### **Backward Compatibility**
- V2 modules can coexist with V1
- Main analyzer automatically detects available versions
- Graceful fallback to V1 if V2 unavailable

### **Upgrade Path**
1. Install V2 dependencies
2. Replace V1 modules with V2 versions
3. Update import statements
4. Enjoy improved visualizations

## 🎨 **Visualization Improvements**

### **Interactive Features**
- **Zoom & Pan**: Navigate large datasets easily
- **Hover Details**: Rich information on mouse hover
- **Legend Interaction**: Click to show/hide data series
- **Export Options**: Save as PNG, SVG, or HTML

### **Better Layouts**
- **Dedicated Space**: Each chart gets full attention
- **Clear Labels**: Better readability and understanding
- **Color Schemes**: Consistent, professional appearance
- **Responsive Design**: Adapts to different screen sizes

## 🚨 **Known Issues Fixed**

1. **Platform Strategy Graph**: Now correctly shows single vs multi-platform games
2. **Platform Parsing**: Handles comma-separated platform strings properly
3. **Chart Spacing**: Eliminated cramped 3x2 grid layouts
4. **Category Granularity**: More meaningful engagement groupings

## 🔮 **Future Enhancements**

- **Custom Color Schemes**: User-defined chart themes
- **Advanced Interactivity**: Drill-down capabilities
- **Export Formats**: PDF, PowerPoint integration
- **Real-time Updates**: Live data refresh capabilities

## 📚 **Examples**

### **Platform Strategy Analysis**
```python
# V2 automatically handles comma-separated platforms
# "windows,osx,linux,web" → ["Windows", "macOS", "Linux", "Web"]
# Correctly counts as 4-platform game
```

### **Engagement Categories**
```python
# V2 provides meaningful groupings
# Comments: 0, 1, 2-3, 4-6, 7-10, 11-20, 20+
# Downloads: 0, 1, 2-3, 4-5, 6-8, 9-12, 12+
```

## 🆘 **Troubleshooting**

### **Common Issues**
1. **Plotly Not Found**: Install with `pip install plotly`
2. **Image Export Fails**: Install kaleido with `pip install kaleido`
3. **Import Errors**: Ensure all V2 modules are in the same directory

### **Performance Tips**
- **Large Datasets**: V2 modules handle large datasets more efficiently
- **Memory Usage**: Plotly charts use less memory than matplotlib
- **Export Speed**: HTML export is faster than PNG export

---

**Upgrade to V2 today for the best game jam analysis experience! 🎮📊✨** 