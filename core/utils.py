import time
import random


def generate_cuid():
    """Generate a CUID-like ID similar to Prisma's @default(cuid())"""
    timestamp = int(time.time() * 1000)
    random_part = ''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=16))
    return f"c{timestamp:x}{random_part}"[:25]
