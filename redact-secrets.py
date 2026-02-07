#!/usr/bin/env python3
"""
Git filter-repo callback to redact secrets from git history.
Replaces Google OAuth credentials with REDACTED values.
"""

import sys
from git_filter_repo import Blob

# Secrets to redact (bytes, not strings)
REPLACEMENTS = {
    b'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': b'GOCSPX-REDACTED',
    b'1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com': b'REDACTED.apps.googleusercontent.com',
}

def rewrite(blob: Blob) -> None:
    """Replace secrets in blob content."""
    old_data = blob.data

    # Apply all replacements
    for old_text, new_text in REPLACEMENTS.items():
        blob.data = blob.data.replace(old_text, new_text)

    # Log if we made changes
    if blob.data != old_data:
        print(f"Redacted secrets in blob {blob.id}", file=sys.stderr)

    return blob.data
