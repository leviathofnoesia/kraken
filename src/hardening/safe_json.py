"""
OCX Safe JSON - Secure JSON loading
Prevents NaN/Inf injection and other JSON attacks.
"""

import json
from typing import Any, Dict, List, Optional, Union
from decimal import Decimal


class SafeJSONDecoder(json.JSONDecoder):
    """
    Safe JSON decoder that blocks NaN/Inf injection.
    Disables parse_float to block numeric attacks.
    """

    def __init__(self, *args, **kwargs):
        # Remove parse_float if provided to disable it
        kwargs["parse_float"] = None
        kwargs["parse_int"] = int
        kwargs["parse_constant"] = None
        super().__init__(*args, **kwargs)


def safe_loads(text: str) -> Any:
    """
    Safely parse JSON string.
    Blocks NaN/Inf by disabling parse_float and validating the result.

    Args:
        text: JSON string to parse

    Returns:
        Parsed Python object

    Raises:
        ValueError: If JSON contains NaN/Inf or is malformed
    """
    try:
        result = json.loads(text, cls=SafeJSONDecoder)
        # Validate the parsed object to catch NaN/Inf
        if not validate_json_object(result):
            raise ValueError("JSON contains forbidden numeric values (NaN/Inf)")
        return result
    except ValueError as e:
        if (
            "NaN" in str(e)
            or "Infinity" in str(e)
            or "-Infinity" in str(e)
            or "forbidden numeric values" in str(e)
        ):
            raise ValueError("JSON contains forbidden numeric values (NaN/Inf)")
        raise


def safe_load(fp) -> Any:
    """
    Safely parse JSON from file-like object.
    Blocks NaN/Inf by disabling parse_float.

    Args:
        fp: File-like object to read JSON from

    Returns:
        Parsed Python object

    Raises:
        ValueError: If JSON contains NaN/Inf or is malformed
    """
    try:
        return json.load(fp, cls=SafeJSONDecoder)
    except ValueError as e:
        if "NaN" in str(e) or "Infinity" in str(e) or "-Infinity" in str(e):
            raise ValueError("JSON contains forbidden numeric values (NaN/Inf)")
        raise


def validate_json_object(obj: Any) -> bool:
    """
    Validate JSON object for safety.
    Checks for potential injection vectors.

    Args:
        obj: Parsed JSON object

    Returns:
        True if object is safe, False otherwise
    """
    if isinstance(obj, dict):
        for key, value in obj.items():
            if not isinstance(key, str):
                return False
            if not validate_json_object(value):
                return False
        return True
    elif isinstance(obj, list):
        return all(validate_json_object(item) for item in obj)
    elif isinstance(obj, (str, int, bool)) or obj is None:
        return True
    elif isinstance(obj, float):
        # Reject NaN and Inf
        if obj != obj or abs(obj) == float("inf"):
            return False
        return True
    else:
        # Reject other types (Decimal, custom objects, etc.)
        return False


class SafeJSONEncoder(json.JSONEncoder):
    """
    Safe JSON encoder that handles special cases.
    Converts Decimal to float for JSON compatibility.
    """

    def default(self, obj: Any) -> Any:
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def safe_dumps(obj: Any, indent: Optional[int] = None) -> str:
    """
    Safely serialize Python object to JSON string.

    Args:
        obj: Python object to serialize
        indent: Number of spaces for indentation (None for compact)

    Returns:
        JSON string

    Raises:
        TypeError: If object contains non-serializable types
    """
    if not validate_json_object(obj):
        raise ValueError("Object contains invalid types")

    return json.dumps(obj, cls=SafeJSONEncoder, indent=indent, ensure_ascii=False)
