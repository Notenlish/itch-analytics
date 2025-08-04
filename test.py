import pathlib
from pybackend.extract import Extractor


def read_contents(p: str | pathlib.Path):
    data = None
    with open(p, "r") as f:
        data = f.read()
    return data


if __name__ == "__main__":
    extractor = Extractor()
    entries_content = read_contents("example/entries.json")
    entries_data = extractor.extract_entries_json(entries_content)
