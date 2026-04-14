#!/usr/bin/env python3
"""
OCX Compression CLI Wrapper
Provides command-line access to compression functionality.
Usage: python3 compress_cli.py <command> [args]
Commands:
  compress <text>     - Compress text and return result
  stats               - Show compression statistics
"""

import sys
import os
import json

COMPRESSION_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, COMPRESSION_DIR)

from ocx_compress import LLMTLDRCompressor, estimate_token_count
from prompt_manifest import get_manifest


def compress_text(text: str) -> dict:
    """Compress text and return result."""
    compressor = LLMTLDRCompressor()
    decompressed = compressor.round_trip(text)

    original_tokens = estimate_token_count(text)
    decompressed_tokens = estimate_token_count(decompressed)

    return {
        "status": 200,
        "decompressed_text": decompressed,
        "metadata": {
            "original_tokens": int(original_tokens),
            "decompressed_tokens": int(decompressed_tokens),
            "token_change_percent": round(
                ((decompressed_tokens - original_tokens) / original_tokens) * 100, 2
            )
            if original_tokens > 0
            else 0,
        },
    }


def get_stats() -> dict:
    """Get compression statistics."""
    compressor = LLMTLDRCompressor()
    manifest = get_manifest()
    return {
        "manifest_stats": manifest.get_stats(),
        "compressor": {"dictionary_size": len(compressor.dictionary.patterns)},
    }


def main():
    if len(sys.argv) < 2:
        print(
            json.dumps(
                {"error": "No command provided", "usage": "compress <text> | stats"}
            )
        )
        sys.exit(1)

    command = sys.argv[1]

    if command == "compress":
        if len(sys.argv) > 2:
            text = sys.argv[2]
        else:
            text = sys.stdin.read()
        result = compress_text(text)
        print(json.dumps(result))

    elif command == "stats":
        result = get_stats()
        print(json.dumps(result))

    else:
        print(json.dumps({"error": f"Unknown command: {command}"}))


if __name__ == "__main__":
    main()
