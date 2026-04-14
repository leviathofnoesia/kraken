"""
OCX Router Module
Entry point for adaptive depth control.
"""

from .ocx_router import AdaptiveRouter, DepthLevel, RouterDecision, get_router

__all__ = [
    "AdaptiveRouter",
    "DepthLevel",
    "RouterDecision",
    "get_router",
]
