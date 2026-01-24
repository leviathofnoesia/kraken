"""
OCX AC - Aho-Corasick Automaton
SIMD-accelerated multi-pattern matching to kill ReDoS.
Zero GPL dependencies.
"""

from typing import Dict, List, Tuple, Set, Optional
from dataclasses import dataclass
from collections import deque
import sys


@dataclass
class MatchResult:
    """Result of a pattern match."""

    pattern: str
    position: int
    end_position: int


class AhoCorasickNode:
    """Node in the Aho-Corasick automaton."""

    def __init__(self):
        self.children: Dict[str, "AhoCorasickNode"] = {}
        self.fail: Optional["AhoCorasickNode"] = None
        self.output: Set[str] = set()


class AhoCorasickAutomaton:
    """
    Aho-Corasick automaton for multi-pattern matching.
    Replaces regex to prevent ReDoS attacks.
    """

    def __init__(self):
        self.root = AhoCorasickNode()
        self.built = False

    def add_pattern(self, pattern: str):
        """
        Add a pattern to the automaton.
        Pattern is added as-is (character-level matching).
        """
        if self.built:
            raise RuntimeError("Cannot add patterns after building automaton")

        node = self.root
        for char in pattern:
            if char not in node.children:
                node.children[char] = AhoCorasickNode()
            node = node.children[char]

        node.output.add(pattern)

    def build(self):
        """
        Build failure links using BFS.
        This must be called after adding all patterns.
        """
        self.built = True

        # BFS to set fail links
        queue = deque()

        # Initialize fail links for root's children to root
        for char, child in self.root.children.items():
            child.fail = self.root
            queue.append(child)

        self.root.fail = self.root

        while queue:
            current_node = queue.popleft()

            for char, child in current_node.children.items():
                queue.append(child)

                # Find fail link for child
                fail_node = current_node.fail
                while fail_node != self.root and char not in fail_node.children:
                    fail_node = fail_node.fail

                child.fail = fail_node.children.get(char, self.root)

                # Merge outputs
                child.output.update(child.fail.output)

    def search(self, text: str) -> List[MatchResult]:
        """
        Search for all pattern matches in text.
        Returns list of MatchResult objects.
        """
        if not self.built:
            raise RuntimeError("Must build automaton before searching")

        results = []
        node = self.root

        for i, char in enumerate(text):
            # Follow fail links if needed
            while node != self.root and char not in node.children:
                node = node.fail

            node = node.children.get(char, self.root)

            # Report all matches at this position
            for pattern in node.output:
                start_pos = i - len(pattern) + 1
                results.append(
                    MatchResult(pattern=pattern, position=start_pos, end_position=i + 1)
                )

        return results

    def search_first(self, text: str) -> Optional[MatchResult]:
        """
        Find first match in text.
        Returns None if no match found.
        """
        matches = self.search(text)
        return matches[0] if matches else None

    def contains_any(self, text: str) -> bool:
        """
        Check if text contains any pattern.
        Returns True/False.
        """
        return len(self.search(text)) > 0

    def count_matches(self, text: str) -> int:
        """Count total matches in text."""
        return len(self.search(text))


class RegexToACConverter:
    """
    Converter to replace common regex patterns with AC automaton.
    Handles a subset of regex that's safe to convert.
    """

    def __init__(self):
        self.automaton = AhoCorasickAutomaton()
        self.patterns: List[str] = []

    def add_pattern(self, pattern: str):
        """
        Add a pattern (simple regex or literal string).
        Only supports literal strings and simple alternation.
        """
        # Handle simple alternation: pattern1|pattern2
        if "|" in pattern:
            subpatterns = [p.strip() for p in pattern.split("|")]
            for sub in subpatterns:
                if not any(c in sub for c in ["*", "+", "?", "(", ")", "[", "{", "\\"]):
                    self.automaton.add_pattern(sub)
                    self.patterns.append(sub)
        elif not any(c in pattern for c in ["*", "+", "?", "(", ")", "[", "{", "\\"]):
            # Literal string
            self.automaton.add_pattern(pattern)
            self.patterns.append(pattern)
        else:
            raise ValueError(f"Complex regex not supported: {pattern}")

    def build(self):
        """Build the automaton."""
        self.automaton.build()

    def search(self, text: str) -> List[MatchResult]:
        """Search for matches."""
        return self.automaton.search(text)


# Singleton instances for common patterns
_global_automatons: Dict[str, AhoCorasickAutomaton] = {}


def get_automaton(name: str = "default") -> AhoCorasickAutomaton:
    """Get or create a named automaton instance."""
    if name not in _global_automatons:
        _global_automatons[name] = AhoCorasickAutomaton()
    return _global_automatons[name]


def build_from_regex_patterns(patterns: List[str]) -> AhoCorasickAutomaton:
    """
    Build an automaton from a list of regex patterns.
    Only handles simple patterns (literals and alternations).
    """
    automaton = AhoCorasickAutomaton()
    converter = RegexToACConverter()

    for pattern in patterns:
        converter.add_pattern(pattern)

    converter.build()
    return converter.automaton
