from os import getenv
from pathlib import Path
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openrouter import OpenRouterModel
from pydantic_ai.providers.openrouter import OpenRouterProvider

from .system_prompt import get_system_prompt
from .context import EditorDeps


class EditorAgent:
    def __init__(self):
        self.agent = Agent(
            model=self._build_model(),
            retries=3,
            deps_type=EditorDeps,
            system_prompt=get_system_prompt(),
            # NO output_type — agent uses tools to write files
            # and returns a text summary when done
        )
        self._register_tools()


    def _register_tools(self):

        @self.agent.tool
        async def write_file(ctx: RunContext[EditorDeps], content: str) -> str:
            """Write a screen or layout file to the Expo project.
            Path must be relative to the project root (e.g. 'app/(tabs)/index.tsx').
            Always use this tool to create or update files."""

            # track
            file_event = {"path": ctx.deps.file_name, "content": content}
            ctx.deps.files_written.append(file_event)

            # push to SSE stream
            await ctx.deps.event_queue.put({
                "type": "file_write",
                "path": ctx.deps.file_name,
                "full_path": ctx.deps.file_path,
                "content": content,
            })

            return f"Successfully wrote {ctx.deps.file_name}"

    @staticmethod
    def get_api_key() -> str:
        api_key = getenv("OPEN_ROUTER_API_KEY")
        if not api_key:
            raise ValueError("OPEN_ROUTER_API_KEY environment variable is not set.")
        return api_key

    def _build_model(self) -> OpenRouterModel:
        return OpenRouterModel(
            'google/gemini-3-flash-preview:nitro',
            provider=OpenRouterProvider(api_key=self.get_api_key()),
        )