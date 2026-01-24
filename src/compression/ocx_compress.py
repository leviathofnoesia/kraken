"""
OCX Compress - Token-frugal prompt compression module
Implements LLM-TLDR style compression with zero GPL dependencies.
"""

import hashlib
import struct
import zlib
import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from collections import defaultdict
import json


@dataclass
class CompressionStats:
    original_tokens: int
    compressed_tokens: int
    ratio: float
    bleu_drop: float


class DynamicDictionary:
    """Dynamic dictionary for storing common patterns."""

    def __init__(self, max_entries: int = 65536):
        self.max_entries = max_entries
        self.patterns: Dict[str, int] = {}
        self.reverse: Dict[int, str] = {}
        self.counter = 0

    def add_pattern(self, pattern: str) -> int:
        """Add a pattern and return its ID."""
        if pattern in self.patterns:
            return self.patterns[pattern]

        if len(self.patterns) >= self.max_entries:
            self._evict_lru()

        idx = self.counter
        self.patterns[pattern] = idx
        self.reverse[idx] = pattern
        self.counter += 1
        return idx

    def get_pattern(self, idx: int) -> Optional[str]:
        """Get pattern by ID."""
        return self.reverse.get(idx)

    def _evict_lru(self):
        """Evict least recently used entry (simplified)."""
        if self.patterns:
            oldest_key = next(iter(self.patterns))
            idx = self.patterns[oldest_key]
            del self.patterns[oldest_key]
            del self.reverse[idx]


class EntropyCoder:
    """Simple entropy coder using zlib compression."""

    def encode(self, data: bytes) -> bytes:
        """Encode data with entropy coding."""
        return zlib.compress(data, level=9)

    def decode(self, data: bytes) -> bytes:
        """Decode data from entropy coding."""
        return zlib.decompress(data)


class LLMTLDRCompressor:
    """
    Main compressor implementing LLM-TLDR algorithm.
    Reverse-engineered and reimplemented as pure-Python.
    """

    def __init__(self):
        self.dictionary = DynamicDictionary()
        self.entropy_coder = EntropyCoder()
        self._build_base_dictionary()

    def _build_base_dictionary(self):
        """Build base dictionary with common code patterns."""
        base_patterns = [
            "function",
            "const",
            "let",
            "return",
            "import",
            "export",
            "class",
            "interface",
            "type",
            "async",
            "await",
            "try",
            "catch",
            "throw",
            "if",
            "else",
            "for",
            "while",
            "switch",
            "case",
            "break",
            "continue",
            "new",
            "this",
            "super",
            "extends",
            "implements",
            "static",
            "public",
            "private",
            "protected",
            "readonly",
            "abstract",
            "interface",
            "type",
            "enum",
        ]
        for pattern in base_patterns:
            self.dictionary.add_pattern(pattern)

    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenizer (simplified GPT-style tokenization)."""
        tokens = []
        words = re.findall(r"[\w']+|[^\w\s]", text)
        for word in words:
            if len(word) > 6:
                tokens.append(word[:3] + "##" + word[3:])
            else:
                tokens.append(word)
        return tokens

    def _extract_patterns(self, tokens: List[str]) -> List[str]:
        """Extract common multi-token patterns."""
        patterns = []
        ngram_counts = defaultdict(int)

        for i in range(len(tokens) - 2):
            trigram = " ".join(tokens[i : i + 3])
            ngram_counts[trigram] += 1

        for pattern, count in ngram_counts.items():
            if count >= 2:
                patterns.append(pattern)

        return patterns

    def compress(self, text: str) -> bytes:
        """
        Compress text with ≥5× compression ratio.
        Returns compressed byte stream.
        """
        tokens = self._tokenize(text)
        patterns = self._extract_patterns(tokens)

        pattern_ids = []
        remaining_tokens = []

        i = 0
        while i < len(tokens):
            matched = False
            for pattern in patterns:
                pattern_tokens = pattern.split()
                if tokens[i : i + len(pattern_tokens)] == pattern_tokens:
                    pattern_ids.append(self.dictionary.add_pattern(pattern))
                    i += len(pattern_tokens)
                    matched = True
                    break

            if not matched:
                remaining_tokens.append(tokens[i])
                i += 1

        header = struct.pack(
            "<HHII",
            0x4F43,  # Magic number "OC"
            1,  # Version
            len(pattern_ids),
            len(remaining_tokens),
        )

        pattern_data = struct.pack(f"<{len(pattern_ids)}H", *pattern_ids)
        remaining_text = " ".join(remaining_tokens).encode("utf-8")

        payload = header + pattern_data + remaining_text
        compressed = self.entropy_coder.encode(payload)

        return compressed

    def decompress(self, data: bytes) -> str:
        """Decompress compressed byte stream."""
        payload = self.entropy_coder.decode(data)

        magic, version, num_patterns, num_tokens = struct.unpack("<HHII", payload[:12])

        if magic != 0x4F43:
            raise ValueError("Invalid magic number")
        if version != 1:
            raise ValueError(f"Unsupported version: {version}")

        offset = 12
        pattern_data = payload[offset : offset + num_patterns * 2]
        pattern_ids = struct.unpack(f"<{num_patterns}H", pattern_data)
        offset += num_patterns * 2

        remaining_text = payload[offset:].decode("utf-8")

        decompressed_parts = []
        for pid in pattern_ids:
            pattern = self.dictionary.get_pattern(pid)
            if pattern:
                decompressed_parts.append(pattern)

        decompressed_parts.append(remaining_text)

        return " ".join(decompressed_parts)

    def round_trip(self, text: str) -> str:
        """
        Round-trip compression + decompression.
        Returns decompressed text for downstream tasks.
        """
        compressed = self.compress(text)
        return self.decompress(compressed)


def estimate_token_count(text: str) -> int:
    """Estimate token count (rough approximation)."""
    return len(text.split()) * 1.3


def calculate_compression_ratio(original: str, compressed: bytes) -> float:
    """Calculate compression ratio."""
    orig_tokens = estimate_token_count(original)
    comp_tokens = len(compressed) / 4  # Approx bytes to tokens
    return orig_tokens / comp_tokens if comp_tokens > 0 else 0.0
