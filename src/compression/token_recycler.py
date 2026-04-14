"""
Token Recycling - Skeleton + Ink decomposition
Decomposes prompts >2k tokens into skeleton (≤256) + ink (variable).
"""

import hashlib
import re
from typing import Tuple, Optional, Dict, List
from dataclasses import dataclass
from pathlib import Path
from collections import OrderedDict
import json


@dataclass
class DecomposedPrompt:
    """Decomposed prompt with skeleton and ink."""

    skeleton: str  # ≤256 tokens, core structure
    ink: str  # Variable details regenerated on-the-fly
    skeleton_hash: str
    original_tokens: int


class TokenRecycler:
    """
    Token recycling system for prompts >2k tokens.
    Stores skeletons in LRU cache; ink parts regenerate.
    """

    SKELETON_TOKEN_LIMIT = 256
    LARGE_PROMPT_THRESHOLD = 2000  # 2k tokens
    LRU_CACHE_SIZE = 500

    def __init__(self, cache_path: Optional[Path] = None):
        self.cache_path = (
            cache_path or Path.home() / ".kraken-code" / "skeleton_cache.json"
        )
        self.skeleton_cache: OrderedDict[str, str] = OrderedDict()  # hash -> skeleton
        self._load_cache()

    def _estimate_tokens(self, text: str) -> int:
        """Estimate token count."""
        return len(text.split()) * 1.3

    def _extract_skeleton(self, prompt: str) -> str:
        """
        Extract skeleton (core structure) from prompt.
        Targets ≤256 tokens.
        """
        lines = prompt.split("\n")
        skeleton_lines = []
        current_tokens = 0

        # Priority patterns for skeleton
        priority_patterns = [
            r"^(import|export|const|let|var|function|class|interface|type)",
            r"^\s*(#|//|/\*)",  # Comments
            r"^\s*(-|\*|\d+\.)",  # List items
            r"^\s*\|\s*\w+",  # Table rows
            r"^[A-Z][A-Z_]+:",  # Section headers
        ]

        # First pass: capture high-priority lines
        for line in lines:
            if (
                self._estimate_tokens(" ".join(skeleton_lines))
                >= self.SKELETON_TOKEN_LIMIT
            ):
                break

            matched = False
            for pattern in priority_patterns:
                if re.match(pattern, line):
                    skeleton_lines.append(line)
                    matched = True
                    break

            if matched:
                continue

            # Add line if it contains structural elements
            if re.search(r"[{}()\[\]]", line) or re.search(r"->|=>", line):
                skeleton_lines.append(line)

        skeleton = "\n".join(skeleton_lines)

        # If still too large, truncate strategically
        while (
            self._estimate_tokens(skeleton) > self.SKELETON_TOKEN_LIMIT
            and skeleton_lines
        ):
            # Remove non-essential lines from middle
            skeleton_lines = skeleton_lines[: len(skeleton_lines) // 2]
            skeleton = "\n".join(skeleton_lines)

        return skeleton

    def _extract_ink(self, prompt: str, skeleton: str) -> str:
        """
        Extract ink (variable details) from prompt.
        Contains parts not in skeleton.
        """
        # Simple approach: remove skeleton lines from original
        skeleton_lines = set(skeleton.split("\n"))
        original_lines = prompt.split("\n")

        ink_lines = [line for line in original_lines if line not in skeleton_lines]
        return "\n".join(ink_lines)

    def _reconstruct(self, skeleton: str, ink: str) -> str:
        """Reconstruct full prompt from skeleton and ink."""
        # This is a simplified reconstruction
        # In practice, would need more sophisticated merging
        return skeleton + "\n\n" + ink

    def _compute_skeleton_hash(self, skeleton: str) -> str:
        """Compute hash for skeleton."""
        return hashlib.sha256(skeleton.encode("utf-8")).hexdigest()

    def _load_cache(self):
        """Load skeleton cache from disk."""
        if self.cache_path.exists():
            try:
                with open(self.cache_path, "r") as f:
                    data = json.load(f)
                    self.skeleton_cache = OrderedDict(data)
            except Exception:
                self.skeleton_cache = OrderedDict()

    def _save_cache(self):
        """Save skeleton cache to disk."""
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.cache_path, "w") as f:
            json.dump(dict(self.skeleton_cache), f)

    def _update_lru(self, key: str):
        """Update LRU order."""
        if key in self.skeleton_cache:
            del self.skeleton_cache[key]
        self.skeleton_cache[key] = self.skeleton_cache.get(key, "")

        # Enforce size limit
        while len(self.skeleton_cache) > self.LRU_CACHE_SIZE:
            self.skeleton_cache.popitem(last=False)

    def decompose(self, prompt: str) -> DecomposedPrompt:
        """
        Decompose prompt into skeleton + ink.
        Only applies if prompt >2k tokens.
        """
        token_count = self._estimate_tokens(prompt)

        if token_count < self.LARGE_PROMPT_THRESHOLD:
            # Small prompt, return as-is
            return DecomposedPrompt(
                skeleton=prompt,
                ink="",
                skeleton_hash=self._compute_skeleton_hash(prompt),
                original_tokens=token_count,
            )

        # Extract skeleton and ink
        skeleton = self._extract_skeleton(prompt)
        ink = self._extract_ink(prompt, skeleton)
        skeleton_hash = self._compute_skeleton_hash(skeleton)

        # Cache skeleton
        self._update_lru(skeleton_hash)
        if skeleton_hash not in self.skeleton_cache:
            self.skeleton_cache[skeleton_hash] = skeleton
            self._save_cache()

        return DecomposedPrompt(
            skeleton=skeleton,
            ink=ink,
            skeleton_hash=skeleton_hash,
            original_tokens=token_count,
        )

    def reconstruct(self, skeleton_hash: str, ink: str) -> Optional[str]:
        """
        Reconstruct prompt from cached skeleton + ink.
        Returns None if skeleton not in cache.
        """
        skeleton = self.skeleton_cache.get(skeleton_hash)
        if skeleton is None:
            return None

        return self._reconstruct(skeleton, ink)

    def get_stats(self) -> dict:
        """Get recycling statistics."""
        total_cached = len(self.skeleton_cache)

        # Calculate average skeleton size
        if total_cached > 0:
            avg_skeleton_tokens = (
                sum(
                    self._estimate_tokens(skel) for skel in self.skeleton_cache.values()
                )
                / total_cached
            )
        else:
            avg_skeleton_tokens = 0

        return {
            "cached_skeletons": total_cached,
            "cache_capacity": self.LRU_CACHE_SIZE,
            "avg_skeleton_tokens": avg_skeleton_tokens,
            "skeleton_token_limit": self.SKELETON_TOKEN_LIMIT,
        }


# Singleton instance
_global_recycler: Optional[TokenRecycler] = None


def get_recycler() -> TokenRecycler:
    """Get the global recycler instance."""
    global _global_recycler
    if _global_recycler is None:
        _global_recycler = TokenRecycler()
    return _global_recycler


def decompose_prompt(prompt: str) -> DecomposedPrompt:
    """Convenience function to decompose a prompt."""
    recycler = get_recycler()
    return recycler.decompose(prompt)


def reconstruct_prompt(skeleton_hash: str, ink: str) -> Optional[str]:
    """Convenience function to reconstruct a prompt."""
    recycler = get_recycler()
    return recycler.reconstruct(skeleton_hash, ink)
