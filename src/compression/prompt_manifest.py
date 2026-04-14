"""
Prompt Manifest System
Maps 16-bit hashed keys to compressed prompt templates.
"""

import hashlib
import struct
from typing import Dict, Optional
from pathlib import Path
import json
from ocx_compress import LLMTLDRCompressor, estimate_token_count


class PromptManifest:
    """
    Manages prompt templates with 16-bit hashed keys.
    Replaces hard-coded prompt strings with compressed storage.
    """

    def __init__(self, manifest_path: Optional[Path] = None):
        self.manifest_path = (
            manifest_path or Path(__file__).parent / "data" / "prompt_manifest.json"
        )
        self.compressor = LLMTLDRCompressor()
        self.prompts: Dict[str, bytes] = {}
        self.metadata: Dict[str, dict] = {}
        self._load_manifest()

    def _load_manifest(self):
        """Load existing manifest from disk."""
        if self.manifest_path.exists():
            try:
                with open(self.manifest_path, "r") as f:
                    data = json.load(f)
                    self.metadata = data.get("metadata", {})
            except Exception:
                self.metadata = {}

    def _save_manifest(self):
        """Save manifest metadata to disk."""
        self.manifest_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.manifest_path, "w") as f:
            json.dump({"metadata": self.metadata, "version": "1.0"}, f, indent=2)

    def _generate_key(self, name: str) -> str:
        """
        Generate 16-bit hashed key from prompt name.
        Returns 4-character hex string.
        """
        hash_bytes = hashlib.md5(name.encode("utf-8")).digest()[:2]
        return hash_bytes.hex()

    def register_prompt(self, name: str, prompt: str, category: str = "general") -> str:
        """
        Register a prompt and return its 16-bit key.
        Compresses and stores the prompt.
        """
        key = self._generate_key(name)
        compressed = self.compressor.compress(prompt)

        self.prompts[key] = compressed
        self.metadata[name] = {
            "key": key,
            "category": category,
            "original_tokens": estimate_token_count(prompt),
            "compressed_size": len(compressed),
            "compression_ratio": estimate_token_count(prompt) / (len(compressed) / 4),
        }

        self._save_manifest()
        return key

    def get_prompt(self, key: str) -> Optional[str]:
        """Retrieve and decompress prompt by 16-bit key."""
        compressed = self.prompts.get(key)
        if compressed is None:
            return None
        return self.compressor.decompress(compressed)

    def get_prompt_by_name(self, name: str) -> Optional[str]:
        """Retrieve prompt by its original name."""
        key = self._generate_key(name)
        return self.get_prompt(key)

    def get_stats(self) -> dict:
        """Get compression statistics."""
        if not self.metadata:
            return {}

        total_original = sum(m["original_tokens"] for m in self.metadata.values())
        total_compressed = sum(m["compressed_size"] for m in self.metadata.values())
        avg_ratio = (
            total_original / (total_compressed / 4) if total_compressed > 0 else 0
        )

        return {
            "total_prompts": len(self.metadata),
            "total_original_tokens": total_original,
            "total_compressed_bytes": total_compressed,
            "average_compression_ratio": avg_ratio,
            "prompts": list(self.metadata.keys()),
        }


def create_preset_manifest() -> PromptManifest:
    """
    Create a preset manifest with common Kraken Code prompts.
    This is a factory function to initialize system.
    """
    manifest = PromptManifest()

    # Register common agent prompts
    # These will be populated with actual prompts from the codebase

    return manifest


# Singleton instance
_global_manifest: Optional[PromptManifest] = None


def get_manifest() -> PromptManifest:
    """Get the global manifest instance."""
    global _global_manifest
    if _global_manifest is None:
        _global_manifest = create_preset_manifest()
    return _global_manifest


def lookup_prompt(key_or_name: str) -> Optional[str]:
    """Convenience function to lookup prompt by key or name."""
    manifest = get_manifest()

    # Try as 16-bit key first
    prompt = manifest.get_prompt(key_or_name)
    if prompt is not None:
        return prompt

    # Try as name
    return manifest.get_prompt_by_name(key_or_name)
