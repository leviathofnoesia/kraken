"""
Prompt Journalling - CRC64-based caching system
Maintains rolling CRC64 of prompts for repeat detection.
"""

import hashlib
import pickle
from typing import Optional, Dict, List
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
import time


@dataclass
class CacheEntry:
    """Entry in the prompt cache."""

    crc64: int
    timestamp: datetime
    prompt_hash: str
    result: dict
    access_count: int = 0
    last_access: datetime = field(default_factory=datetime.now)


class PromptJournal:
    """
    Keeps rolling CRC64 of outgoing prompts.
    Serves cached AST for repeats within 7 days.
    """

    CACHE_TTL_DAYS = 7
    MAX_ENTRIES = 10000

    def __init__(self, cache_path: Optional[Path] = None):
        self.cache_path = (
            cache_path or Path.home() / ".kraken-code" / "prompt_cache.pkl"
        )
        self.cache: Dict[int, CacheEntry] = {}
        self.crc64_history: List[tuple] = []  # (crc64, timestamp)
        self._load_cache()

    def _compute_crc64(self, text: str) -> int:
        """Compute CRC64 checksum of text."""
        # Use SHA-256 as proxy (Python doesn't have built-in CRC64)
        hash_bytes = hashlib.sha256(text.encode("utf-8")).digest()
        # Take first 8 bytes as 64-bit hash
        return int.from_bytes(hash_bytes[:8], byteorder="big")

    def _compute_content_hash(self, text: str) -> str:
        """Compute full hash for deduplication."""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def _save_cache(self):
        """Save cache to disk."""
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.cache_path, "wb") as f:
            pickle.dump({"cache": self.cache, "history": self.crc64_history}, f)

    def _load_cache(self):
        """Load cache from disk."""
        if self.cache_path.exists():
            try:
                with open(self.cache_path, "rb") as f:
                    data = pickle.load(f)
                    self.cache = data.get("cache", {})
                    self.crc64_history = data.get("history", [])
                self._cleanup_expired()
            except Exception:
                self.cache = {}
                self.crc64_history = []

    def _cleanup_expired(self):
        """Remove entries older than TTL."""
        cutoff = datetime.now() - timedelta(days=self.CACHE_TTL_DAYS)

        # Remove expired entries
        self.cache = {
            crc64: entry
            for crc64, entry in self.cache.items()
            if entry.timestamp > cutoff
        }

        # Cleanup history
        self.crc64_history = [
            (crc64, ts) for crc64, ts in self.crc64_history if ts > cutoff
        ]

    def _evict_lru(self):
        """Evict least recently used entry."""
        if len(self.cache) >= self.MAX_ENTRIES:
            # Find least recently used
            lru_crc64 = min(
                self.cache.items(), key=lambda x: (x[1].last_access, x[1].access_count)
            )[0]
            del self.cache[lru_crc64]

    def check_repeat(self, prompt: str) -> Optional[dict]:
        """
        Check if prompt CRC64 has been seen within 7 days.
        Returns cached result if found.
        """
        crc64 = self._compute_crc64(prompt)
        content_hash = self._compute_content_hash(prompt)

        # Check for exact match
        entry = self.cache.get(crc64)
        if entry:
            if entry.prompt_hash == content_hash:
                entry.access_count += 1
                entry.last_access = datetime.now()
                self._save_cache()
                return entry.result

        # Check history for recent CRC64
        for hist_crc64, hist_timestamp in reversed(self.crc64_history):
            if hist_crc64 == crc64:
                # Found in history, check if still valid
                age = datetime.now() - hist_timestamp
                if age.days < self.CACHE_TTL_DAYS:
                    # CRC64 repeat found within TTL
                    return {"is_repeat": True, "age_hours": age.total_seconds() / 3600}

        return None

    def record_prompt(self, prompt: str, result: dict):
        """
        Record a prompt in the journal.
        Stores both CRC64 and full result.
        """
        crc64 = self._compute_crc64(prompt)
        content_hash = self._compute_content_hash(prompt)

        self._evict_lru()

        entry = CacheEntry(
            crc64=crc64,
            timestamp=datetime.now(),
            prompt_hash=content_hash,
            result=result,
            access_count=1,
        )

        self.cache[crc64] = entry
        self.crc64_history.append((crc64, datetime.now()))

        # Keep history bounded
        if len(self.crc64_history) > self.MAX_ENTRIES * 2:
            self.crc64_history = self.crc64_history[-self.MAX_ENTRIES :]

        self._save_cache()

    def get_stats(self) -> dict:
        """Get journal statistics."""
        total_lookups = sum(e.access_count for e in self.cache.values())
        unique_prompts = len(self.cache)

        # Calculate repeat rate
        total_history = len(self.crc64_history)
        unique_crc64 = len(set(crc64 for crc64, _ in self.crc64_history))
        repeat_rate = (total_history - unique_crc64) / max(total_history, 1) * 100

        return {
            "unique_prompts": unique_prompts,
            "total_lookups": total_lookups,
            "repeat_rate_percent": repeat_rate,
            "history_size": total_history,
            "cache_size_bytes": len(self.cache),
        }


# Singleton instance
_global_journal: Optional[PromptJournal] = None


def get_journal() -> PromptJournal:
    """Get the global journal instance."""
    global _global_journal
    if _global_journal is None:
        _global_journal = PromptJournal()
    return _global_journal


def check_prompt_repeat(prompt: str) -> Optional[dict]:
    """Convenience function to check for prompt repeats."""
    journal = get_journal()
    return journal.check_repeat(prompt)


def record_prompt(prompt: str, result: dict):
    """Convenience function to record a prompt."""
    journal = get_journal()
    journal.record_prompt(prompt, result)
