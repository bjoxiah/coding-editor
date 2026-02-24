import asyncio
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class AgentDeps:
    project_path: str
    app_name: str
    brand_color: Optional[str] = None
    files_written: list[dict] = field(default_factory=list)
    event_queue: asyncio.Queue = field(default_factory=asyncio.Queue)