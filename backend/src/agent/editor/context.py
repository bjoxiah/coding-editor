import asyncio
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class EditorDeps:
    file_name: str
    file_path: str
    file_content: str
    files_written: list[dict] = field(default_factory=list)
    event_queue: asyncio.Queue = field(default_factory=asyncio.Queue)