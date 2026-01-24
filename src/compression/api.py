"""
OCX Compression API
REST API endpoints for prompt compression.
"""

import json
from typing import Dict, Any, Optional
from dataclasses import asdict
from ocx_compress import (
    LLMTLDRCompressor,
    estimate_token_count,
    calculate_compression_ratio,
)
from prompt_manifest import get_manifest, PromptManifest


class CompressionAPI:
    """Simple HTTP-like API for compression endpoints."""

    def __init__(self):
        self.compressor = LLMTLDRCompressor()
        self.manifest = get_manifest()

    def _estimate_bleu_drop(self, original: str, decompressed: str) -> float:
        """
        Estimate BLEU score drop between original and decompressed.
        Simplified approximation (actual BLEU would require proper tokenizer).
        """
        # Simplified BLEU approximation using word overlap
        orig_words = set(original.lower().split())
        decomp_words = set(decompressed.lower().split())

        if not orig_words:
            return 0.0

        overlap = len(orig_words & decomp_words)
        precision = overlap / len(decomp_words) if decomp_words else 0

        # Invert to get drop percentage
        return (1.0 - precision) * 100

    def v1_alpha(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        /v1/alpha endpoint
        Compresses prompts at ≥5× ratio with <2% BLEU drop.
        Returns: compressed data + metadata
        """
        if "prompt" not in request:
            return {"error": "Missing required field: prompt", "status": 400}

        prompt = request["prompt"]
        compressed = self.compressor.compress(prompt)
        decompressed = self.compressor.decompress(compressed)

        # Calculate metrics
        original_tokens = estimate_token_count(prompt)
        compressed_tokens = len(compressed) / 4  # Approx bytes to tokens
        ratio = original_tokens / compressed_tokens if compressed_tokens > 0 else 0
        bleu_drop = self._estimate_bleu_drop(prompt, decompressed)

        return {
            "status": 200,
            "compressed_data": compressed.hex(),
            "metadata": {
                "original_tokens": int(original_tokens),
                "compressed_tokens": int(compressed_tokens),
                "compression_ratio": round(ratio, 2),
                "bleu_drop_percent": round(bleu_drop, 2),
                "meets_threshold": ratio >= 5.0 and bleu_drop < 2.0,
            },
        }

    def v1_beta(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        /v1/beta endpoint
        Does round-trip compression + decompression.
        Returns: decompressed text (downstream tasks never see condensed form).
        """
        if "prompt" not in request:
            return {"error": "Missing required field: prompt", "status": 400}

        prompt = request["prompt"]

        # Round-trip compression
        decompressed = self.compressor.round_trip(prompt)

        # Calculate metrics
        original_tokens = estimate_token_count(prompt)
        decompressed_tokens = estimate_token_count(decompressed)

        return {
            "status": 200,
            "decompressed_text": decompressed,
            "metadata": {
                "original_tokens": int(original_tokens),
                "decompressed_tokens": int(decompressed_tokens),
                "token_change_percent": round(
                    ((decompressed_tokens - original_tokens) / original_tokens) * 100, 2
                ),
            },
        }

    def get_stats(self) -> Dict[str, Any]:
        """Get compression statistics."""
        return {
            "manifest_stats": self.manifest.get_stats(),
            "compressor": {"dictionary_size": len(self.compressor.dictionary.patterns)},
        }


# Singleton instance
_global_api: Optional[CompressionAPI] = None


def get_api() -> CompressionAPI:
    """Get the global API instance."""
    global _global_api
    if _global_api is None:
        _global_api = CompressionAPI()
    return _global_api


def compress_request_v1_alpha(prompt: str) -> Dict[str, Any]:
    """Convenience function for /v1/alpha endpoint."""
    api = get_api()
    return api.v1_alpha({"prompt": prompt})


def compress_request_v1_beta(prompt: str) -> Dict[str, Any]:
    """Convenience function for /v1/beta endpoint."""
    api = get_api()
    return api.v1_beta({"prompt": prompt})
