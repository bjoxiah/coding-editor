import asyncio
import json
import logging
from typing import AsyncGenerator

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic_ai import ImageUrl

load_dotenv()

from agent.scaffold.agent import ScaffoldingAgent
from agent.scaffold.context import AgentDeps
from .model import EditRequestModel, ScaffoldRequestModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("agent_api")

app = FastAPI(title="Agent Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"

async def stream_agent(deps: AgentDeps, prompt: list) -> AsyncGenerator[str, None]:
    yield sse({"type": "status", "message": "Agent initialized..."})

    queue = deps.event_queue
    sc_agent = ScaffoldingAgent()
    task = asyncio.create_task(sc_agent.agent.run(prompt, deps=deps))
    task.add_done_callback(lambda _: queue.put_nowait(None))

    try:
        while (event := await queue.get()) is not None:
            yield sse(event)

        result = task.result()
        yield sse({
            "type": "done",
            "summary": str(getattr(result, "output", result)),
            "files": [f["path"] for f in getattr(deps, "files_written", [])],
        })

    except Exception as e:
        logger.error("Agent error: %s", e, exc_info=True)
        yield sse({"type": "error", "message": str(e)})

    finally:
        task.cancel()

@app.post("/generate")
async def generate(request: ScaffoldRequestModel) -> StreamingResponse:
    deps = AgentDeps(
        project_path=request.project_path,
        app_name=request.app_name,
        brand_color=request.brand_color,
    )
    prompt = [request.user_prompt, *[ImageUrl(url=u) for u in request.image_urls]]

    return StreamingResponse(
        stream_agent(deps, prompt),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )

@app.post("/edit")
async def edit_file(request: EditRequestModel) -> None:
    raise HTTPException(status_code=501, detail="Not implemented")

def run() -> None:
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    run()