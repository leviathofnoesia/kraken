"""
OCX Hardening Module
Entry point for security hardening features.
"""

from .ocx_ac import (
    AhoCorasickAutomaton,
    AhoCorasickNode,
    MatchResult,
    RegexToACConverter,
    get_automaton,
    build_from_regex_patterns,
)
from .constant_time import (
    constant_time_compare,
    verify_webhook_signature,
    verify_hmac_signature,
    constant_time_bytes_equal,
)
from .safe_json import (
    SafeJSONDecoder,
    SafeJSONEncoder,
    safe_loads,
    safe_load,
    safe_dumps,
    validate_json_object,
)

__all__ = [
    # Aho-Corasick
    "AhoCorasickAutomaton",
    "AhoCorasickNode",
    "MatchResult",
    "RegexToACConverter",
    "get_automaton",
    "build_from_regex_patterns",
    # Constant-time operations
    "constant_time_compare",
    "verify_webhook_signature",
    "verify_hmac_signature",
    "constant_time_bytes_equal",
    # Safe JSON
    "SafeJSONDecoder",
    "SafeJSONEncoder",
    "safe_loads",
    "safe_load",
    "safe_dumps",
    "validate_json_object",
]
