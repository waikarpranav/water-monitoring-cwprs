from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from .config import settings
from .database import engine
from .models.reading import Base
from .routers import ingest, ws

app = FastAPI(title="Water Quality Monitor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        columns = await conn.run_sync(
            lambda sync_conn: {
                column["name"]
                for column in inspect(sync_conn).get_columns("sensor_readings")
            }
        )
        gps_columns = {
            "latitude": "FLOAT",
            "longitude": "FLOAT",
            "gps_fix": "BOOLEAN NOT NULL DEFAULT FALSE",
        }
        for column_name, column_type in gps_columns.items():
            if column_name not in columns:
                await conn.execute(text(
                    f"ALTER TABLE sensor_readings ADD COLUMN {column_name} {column_type}"
                ))

app.include_router(ingest.router)
app.add_api_websocket_route("/ws/live", ws.ws_endpoint)

@app.get("/")
async def root():
    return {"status": "ok"}