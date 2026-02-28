import asyncio
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class EditorDeps:
    relative_path: str
    content: str
    event_queue: asyncio.Queue = field(default_factory=asyncio.Queue)