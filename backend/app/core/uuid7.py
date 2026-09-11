import os
import time
import uuid


def uuid7() -> uuid.UUID:
    """Generate a UUIDv7 (RFC 9562) time-ordered UUID."""
    # 48-bit timestamp in milliseconds
    timestamp_ms = int(time.time() * 1000)
    time_bytes = timestamp_ms.to_bytes(6, byteorder="big")

    # 10 bytes of randomness
    rand_bytes = bytearray(os.urandom(10))

    # Set version to 7 (0b0111 in top 4 bits of byte 6)
    rand_bytes[0] = (rand_bytes[0] & 0x0F) | 0x70

    # Set variant to RFC 4122 / 9562 (0b10 in top 2 bits of byte 8)
    rand_bytes[2] = (rand_bytes[2] & 0x3F) | 0x80

    raw_bytes = bytes(time_bytes + rand_bytes)
    return uuid.UUID(bytes=raw_bytes)
