import asyncio
import json
import logging
from typing import AsyncGenerator, Literal, Union

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic_ai import ImageUrl

load_dotenv()

from agent.scaffold.agent import ScaffoldingAgent
from agent.scaffold.context import AgentDeps
from agent.editor.agent import EditorAgent
from agent.editor.context import EditorDeps
from .model import EditRequestModel, ScaffoldRequestModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("agent_api")

app = FastAPI(title="Agent Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

sc_agent = ScaffoldingAgent()
ed_agent = EditorAgent()

def sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"

async def stream_agent(
    operation: Literal["scaffold", "edit"],
    deps:      Union[AgentDeps, EditorDeps],
    prompt:    list,
) -> AsyncGenerator[str, None]:
    yield sse({"type": "status", "message": "Agent initialized..."})

    queue  = deps.event_queue
    agent  = sc_agent if operation == "scaffold" else ed_agent
    task   = asyncio.create_task(agent.agent.run(prompt, deps=deps))
    task.add_done_callback(lambda _: queue.put_nowait(None))

    try:
        while (event := await queue.get()) is not None:
            yield sse(event)

        result = task.result()
        yield sse({
            "type":    "done",
            "summary": str(getattr(result, "output", result)),
            "files":   [f["path"] for f in getattr(deps, "files_written", [])],
        })

    except Exception as e:
        logger.error("Agent error: %s", e, exc_info=True)
        yield sse({"type": "error", "message": str(e)})

    finally:
        task.cancel()

SSE_HEADERS = {"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}

@app.post("/generate")
async def generate(request: ScaffoldRequestModel) -> StreamingResponse:
    deps   = AgentDeps(
        project_path=request.project_path, 
        app_name=request.app_name, 
        brand_color=request.brand_color
    )
    prompt = [request.user_prompt, *[ImageUrl(url=u) for u in request.image_urls]]
    return StreamingResponse(stream_agent("scaffold", deps, prompt), media_type="text/event-stream", headers=SSE_HEADERS)

@app.post("/edit")
async def edit_file(request: EditRequestModel) -> StreamingResponse:
    deps   = EditorDeps(
        relative_path=request.relative_path, 
        content=request.content
    )
    prompt = [request.user_prompt]
    return StreamingResponse(stream_agent("edit", deps, prompt), media_type="text/event-stream", headers=SSE_HEADERS)

def run() -> None:
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    run()