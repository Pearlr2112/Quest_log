import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from database import init_db
from routers import character, tasks, daily_quests, bosses, inventory

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Quest Log API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(character.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(daily_quests.router, prefix="/api")
app.include_router(bosses.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")

@app.get("/api/healthz")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
