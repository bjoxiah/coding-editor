from os import getenv
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openrouter import OpenRouterModel
from pydantic_ai.providers.openrouter import OpenRouterProvider

from .system_prompt import get_system_prompt
from .context import AgentDeps


class ScaffoldingAgent:
    def __init__(self):
        self.agent = Agent(
            model=self._build_model(),
            retries=3,
            deps_type=AgentDeps,
            system_prompt=get_system_prompt(),
        )
        self._register_tools()
        self._register_dynamic_prompt()

    def _register_dynamic_prompt(self):
        @self.agent.system_prompt(dynamic=True)
        async def dynamic_system_prompt(ctx: RunContext[AgentDeps]) -> str:
            return (
                f'\n\nThe app is called "{ctx.deps.app_name}". '
                f"Use this name in headers and branding throughout the app.\n"
                f"Primary brand color: {ctx.deps.brand_color} — use it for buttons, "
                f"active tabs, headers, and key accents.\n"
                f"If images were provided, use them for visual direction only "
                f"(layout, mood, color palette) — do not reference them in code."
            )

    def _register_tools(self):
        @self.agent.tool
        async def write_file(ctx: RunContext[AgentDeps], path: str, content: str) -> str:
            """Write a file to the Expo project.
            path must be relative to the project root e.g. 'app/(tabs)/index.tsx'.
            Use this tool for every file you create or update."""

            if ".." in path or path.startswith("/"):
                return "Error: path must be relative with no '..'"

            ctx.deps.files_written.append({"path": path, "content": content})

            await ctx.deps.event_queue.put({
                "type": "file_write",
                "path": path,
                "content": content,
            })

            return f"Wrote {path}"

    @staticmethod
    def get_api_key() -> str:
        api_key = getenv("OPEN_ROUTER_API_KEY")
        if not api_key:
            raise ValueError("OPEN_ROUTER_API_KEY environment variable is not set.")
        return api_key

    def _build_model(self) -> OpenRouterModel:
        return OpenRouterModel(
            "google/gemini-3-flash-preview:nitro",
            provider=OpenRouterProvider(api_key=self.get_api_key()),
        )