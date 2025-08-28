import os
from sqlmodel import Session, select
from models import MetadataEntry, JamGame, Game, GameJam, GameComment, JamComment
from collections import Counter
from wordcloud import WordCloud
import numpy as np
from plotly import graph_objs as go


def extract_layout(wc: WordCloud):
    words, freqs, positions, orientations, font_sizes = [], [], [], [], []
    colors = []
    for (word, freq), font_size, position, orientation, color in wc.layout_:
        words.append(word)
        freqs.append(freq)
        positions.append(position)
        orientations.append(orientation)
        font_sizes.append(font_size)
        colors.append(color)
    return positions, freqs, words, font_sizes, orientations, colors


class WordcloudAnalyzer:
    def __init__(self, session: Session):
        self.session = session
        self.output_dir = "jam_analysis_outputs"
        os.makedirs(self.output_dir, exist_ok=True)

    def analyze_wordcloud(self, jam_id: int, jam_name: str):
        self.analyze_wordcloud_tags(jam_id, jam_name)
        self.analyze_wordcloud_genres(jam_id, jam_name)
        self.analyze_wordcloud_game_titles(jam_id, jam_name)
        self.analyze_wordcloud_game_descriptions(jam_id, jam_name)
        self.analyze_wordcloud_platforms(jam_id, jam_name)
        self.analyze_wordcloud_comments(jam_id, jam_name)

    def _analyze_graph_counter(self, counter: Counter, file_path: str):
        img_w, img_h = 1200, 600
        scale = 8
        max_words = 1000

        # --- Generate word cloud layout (not rendering) ---
        cloud = WordCloud(
            width=img_w,
            height=img_h,
            scale=scale,
            max_words=max_words,
            prefer_horizontal=0.8,
            background_color="white",
            collocations=False,
        ).generate_from_frequencies(counter)

        wc_width = cloud.width
        wc_height = cloud.height
        wc_array = np.array(cloud)

        # Fuck plotly, fuck wordcloud, I cannot get plotly.scatter to correctly display the words
        # fuck image arrays.

        cloud.to_file(file_path)

    def _analyze_graph_fulltext(self, text: str, file_path: str):
        img_w, img_h = 1200, 600
        scale = 8
        max_words = 1000

        cloud = WordCloud(
            width=img_w,
            height=img_h,
            scale=scale,
            max_words=max_words,
            prefer_horizontal=0.8,
            background_color="white",
            collocations=False,
        ).generate_from_text(text)

        wc_width = cloud.width
        wc_height = cloud.height
        wc_array = np.array(cloud)

        # Fuck plotly, fuck wordcloud, I cannot get plotly.scatter to correctly display the words
        # fuck image arrays.

        cloud.to_file(file_path)

    def analyze_wordcloud_game_descriptions(self, jam_id: int, jam_name: str):
        games = self.session.exec(
            select(Game)
            .join(JamGame, JamGame.game_id == Game.id)
            .where(JamGame.gamejam_id == jam_id)
        ).all()
        t = ""
        for g in games:
            t += g.description + " "
        png_path = os.path.join(
            self.output_dir, f"{jam_name.replace(' ', '_')}_wordcloud_description.png"
        )

        self._analyze_graph_fulltext(t, png_path)

    def analyze_wordcloud_game_titles(self, jam_id: int, jam_name: str):
        games = self.session.exec(
            select(Game)
            .join(JamGame, JamGame.game_id == Game.id)
            .where(JamGame.gamejam_id == jam_id)
        ).all()
        t = ""
        for g in games:
            t += g.title + " "
        png_path = os.path.join(
            self.output_dir, f"{jam_name.replace(' ', '_')}_wordcloud_gametitles.png"
        )

        self._analyze_graph_fulltext(t, png_path)

    def analyze_wordcloud_comments(self, jam_id: int, jam_name: str):
        t = ""
        gamecomments = self.session.exec(
            select(GameComment)
            .join(Game, GameComment.game_id == Game.id)
            .join(JamGame, JamGame.game_id == Game.id)
            .where(JamGame.gamejam_id == jam_id)
        ).all()
        for gc in gamecomments:
            t += gc.content + " "

        jamcomments = self.session.exec(
            select(JamComment)
            .join(JamGame, JamComment.jamgame_id == JamGame.id)
            .where(JamGame.gamejam_id == jam_id)
        ).all()
        for jc in jamcomments:
            t += jc.content + " "

        png_path = os.path.join(
            self.output_dir, f"{jam_name.replace(' ', '_')}_wordcloud_comments.png"
        )
        self._analyze_graph_fulltext(t, png_path)

    def analyze_wordcloud_platforms(self, jam_id: int, jam_name: str):
        games = self.session.exec(
            select(Game)
            .join(JamGame, JamGame.game_id == Game.id)
            .where(JamGame.gamejam_id == jam_id)
        ).all()

        counter = Counter()
        for g in games:
            platforms = None
            for m in g.metadata_entries:
                if m.key == "platforms":
                    platforms = m.value
            if platforms is None:
                continue
            for word in platforms.split(","):
                counter[word] += 1

        png_path = os.path.join(
            self.output_dir, f"{jam_name.replace(' ', '_')}_wordcloud_platforms.png"
        )
        self._analyze_graph_counter(counter, png_path)

    def analyze_wordcloud_genres(self, jam_id: int, jam_name: str):
        games = self.session.exec(
            select(Game)
            .join(JamGame, JamGame.game_id == Game.id)
            .where(JamGame.gamejam_id == jam_id)
        ).all()

        counter = Counter()
        for g in games:
            genre = None
            for m in g.metadata_entries:
                if m.key == "genre":
                    genre = m.value
            if genre is None:
                continue
            for word in genre.split(","):
                counter[word] += 1
        print(counter)

        png_path = os.path.join(
            self.output_dir, f"{jam_name.replace(' ', '_')}_wordcloud_genres.png"
        )
        self._analyze_graph_counter(counter, png_path)

    def analyze_wordcloud_tags(self, jam_id: int, jam_name: str):
        games = self.session.exec(
            select(Game)
            .join(JamGame, JamGame.game_id == Game.id)
            .where(JamGame.gamejam_id == jam_id)
        ).all()

        counter = Counter()
        for g in games:
            tags = None
            for m in g.metadata_entries:
                if m.key == "tags":
                    tags = m.value
            if tags is None:
                continue
            for word in tags.split(","):
                counter[word] += 1

        png_path = os.path.join(
            self.output_dir, f"{jam_name.replace(' ', '_')}_wordcloud_tags.png"
        )
        self._analyze_graph_counter(counter, png_path)
