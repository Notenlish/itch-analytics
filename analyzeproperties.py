import collections
import json


def analyze_json_properties(json_objects: list[dict]) -> dict:
    """
    Analyzes a list of JSON objects to determine which properties are
    always present (mandatory) and which are optional.

    Args:
        json_objects: A list of dictionaries, where each dictionary represents
                      a JSON object.

    Returns:
        A dictionary with two keys: 'mandatory_properties' and 'optional_properties'.
        Each key maps to a list of strings representing the paths of the properties.
        Paths are represented using dot notation (e.g., 'user.address.street').
    """

    if not json_objects:
        return {"mandatory_properties": [], "optional_properties": []}

    # Stores the count of how many objects each path appears in.
    path_presence_counts = collections.defaultdict(int)
    # Stores all unique paths found across all objects.
    all_unique_paths = set()

    def _find_paths_in_object(obj, current_path_prefix="", current_object_paths=None):
        """
        Recursively finds all paths within a single JSON object and adds them
        to the current_object_paths set.
        """
        if current_object_paths is None:
            current_object_paths = set()

        if isinstance(obj, dict):
            for key, value in obj.items():
                # Construct the full path for the current key
                new_path = (
                    f"{current_path_prefix}.{key}" if current_path_prefix else key
                )

                # Add this path to the set of paths present in the current object
                current_object_paths.add(new_path)

                # Add this path to the global set of all unique paths
                all_unique_paths.add(new_path)

                # Recursively call for nested dictionaries
                if isinstance(value, dict):
                    _find_paths_in_object(value, new_path, current_object_paths)
                # Recursively call for items within lists, especially if they are dictionaries
                elif isinstance(value, list):
                    for i, item in enumerate(value):
                        # For list items, we don't add an index to the path unless needed
                        # for specific item properties. Here, we're interested in properties
                        # *within* the list items if they are objects.
                        if isinstance(item, dict):
                            # We use the same path for properties within list items,
                            # assuming the structure within the list is consistent
                            # or we want to know if 'list_name.property_name' exists
                            # across all objects that have this list.
                            _find_paths_in_object(item, new_path, current_object_paths)
        elif isinstance(obj, list):
            # If the top-level object is a list (unlikely for a "list of json objects" but handles recursion)
            for i, item in enumerate(obj):
                if isinstance(item, dict):
                    _find_paths_in_object(
                        item, current_path_prefix, current_object_paths
                    )

        return current_object_paths

    # Iterate through each JSON object to collect all paths and their counts
    for obj in json_objects:
        # Get all paths present in the current object
        paths_in_this_object = _find_paths_in_object(obj)

        # Increment the count for each path found in this object
        for path in paths_in_this_object:
            path_presence_counts[path] += 1

    mandatory_properties = []
    optional_properties = []
    num_objects = len(json_objects)

    # Determine mandatory vs. optional based on counts
    for path in sorted(list(all_unique_paths)):  # Sort for consistent output
        if path_presence_counts[path] == num_objects:
            mandatory_properties.append(path)
        else:
            optional_properties.append(path)

    return {
        "mandatory_properties": mandatory_properties,
        "optional_properties": optional_properties,
    }


with open("example/results.json", "r") as f:
    data = json.load(f)["results"]
# print(data)
properties = analyze_json_properties(data)
# print("Properties is:", properties)
print("Mandatory:", properties["mandatory_properties"])
print("Optional:", properties["optional_properties"])
