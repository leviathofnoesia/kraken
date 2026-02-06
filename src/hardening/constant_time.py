"""
OCX Security - Constant-time operations
Constant-time secret comparison for webhook signature verification.
"""

import hashlib
import hmac


def constant_time_compare(val1: str, val2: str) -> bool:
    """
    Compare two strings in constant time.
    Prevents timing attacks in signature verification.

    Uses hmac.compare_digest which is implemented in C and guaranteed
    to be constant-time by the Python stdlib.

    Args:
        val1: First string (e.g., computed signature)
        val2: Second string (e.g., expected signature)

    Returns:
        True if strings are equal, False otherwise
    """
    return hmac.compare_digest(val1, val2)


def verify_webhook_signature(
    payload: bytes, signature: str, secret: str, algorithm: str = "sha256"
) -> bool:
    """
    Verify webhook signature using constant-time comparison.

    Args:
        payload: Raw request body bytes
        signature: Signature from request headers (e.g., "sha256=...")
        secret: Webhook secret
        algorithm: Hash algorithm (default: sha256)

    Returns:
        True if signature is valid, False otherwise
    """
    # Parse signature header
    if "=" in signature:
        algo_sig = signature.split("=", 1)
        if len(algo_sig) != 2:
            return False
        expected_algo, sig_value = algo_sig

        # Check algorithm matches
        if algorithm.replace("-", "").lower() != expected_algo:
            return False

        sig_to_compare = sig_value
    else:
        sig_to_compare = signature

    # Compute expected signature
    digest = getattr(hashlib, algorithm.lower(), hashlib.sha256)
    computed_sig = hmac.new(secret.encode("utf-8"), payload, digest).hexdigest()

    # Constant-time comparison
    return constant_time_compare(computed_sig, sig_to_compare)


def verify_hmac_signature(
    message: bytes, signature: str, secret: str, algorithm: str = "sha256"
) -> bool:
    """
    Verify HMAC signature using constant-time comparison.

    Args:
        message: Message to verify
        signature: Signature to check
        secret: Secret key
        algorithm: Hash algorithm (default: sha256)

    Returns:
        True if signature is valid, False otherwise
    """
    digest = getattr(hashlib, algorithm.lower(), hashlib.sha256)
    computed = hmac.new(secret.encode("utf-8"), message, digest).hexdigest()

    return constant_time_compare(computed, signature)


def constant_time_bytes_equal(val1: bytes, val2: bytes) -> bool:
    """
    Compare two byte sequences in constant time.

    Uses hmac.compare_digest which is implemented in C and guaranteed
    to be constant-time by the Python stdlib.

    Args:
        val1: First byte sequence
        val2: Second byte sequence

    Returns:
        True if equal, False otherwise
    """
    return hmac.compare_digest(val1, val2)
