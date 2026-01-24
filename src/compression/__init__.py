"""
OCX Compression Module
Entry point for all compression-related functionality.
"""

from ocx_compress import (
    LLMTLDRCompressor,
    estimate_token_count,
    calculate_compression_ratio,
)
from prompt_manifest import PromptManifest, get_manifest, lookup_prompt
from prompt_journal import (
    PromptJournal,
    get_journal,
    check_prompt_repeat,
    record_prompt,
)
from token_recycler import (
    TokenRecycler,
    get_recycler,
    decompose_prompt,
    reconstruct_prompt,
    DecomposedPrompt,
)

__all__ = [
    # Compression
    "LLMTLDRCompressor",
    "estimate_token_count",
    "calculate_compression_ratio",
    # Prompt Manifest
    "PromptManifest",
    "get_manifest",
    "lookup_prompt",
    # Prompt Journal
    "PromptJournal",
    "get_journal",
    "check_prompt_repeat",
    "record_prompt",
    # Token Recycler
    "TokenRecycler",
    "get_recycler",
    "decompose_prompt",
    "reconstruct_prompt",
    "DecomposedPrompt",
]
