from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timezone
from typing import List

from ..database import get_session
from ..schemas.reading import SensorReadingIn, SensorReadingOut
from ..models.reading import SensorReading
from ..services.ml_service import predict_pollution
from .ws import manager

router = APIRouter(prefix="/readings", tags=["ingest"])


@router.post("/", response_model=SensorReadingOut, status_code=status.HTTP_201_CREATED)
async def ingest_reading(payload: SensorReadingIn, db: AsyncSession = Depends(get_session)):
    ts = payload.timestamp or datetime.now(timezone.utc)

    label, score = predict_pollution(payload.ph, payload.turbidity_ntu, payload.h2s_ppm)

    alert_triggered = bool(
        payload.ph < 6.5 or payload.ph > 8.5 or
        payload.turbidity_ntu > 4.0 or
        payload.h2s_ppm > 0.05 or
        label == "Not Safe"
    )

    reading = SensorReading(
        device_id=payload.device_id,
        latitude=payload.latitude if payload.gps_fix else None,
        longitude=payload.longitude if payload.gps_fix else None,
        gps_fix=payload.gps_fix,
        ph=payload.ph,
        turbidity_ntu=payload.turbidity_ntu,
        temperature_c=payload.temperature_c,
        h2s_ppm=payload.h2s_ppm,
        timestamp=ts,
        pollution_label=label,
        pollution_score=score,
        alert_triggered=alert_triggered,
    )
    db.add(reading)
    await db.commit()
    await db.refresh(reading)

    await manager.broadcast({
        "id": reading.id,
        "device_id": reading.device_id,
        "latitude": reading.latitude,
        "longitude": reading.longitude,
        "gps_fix": reading.gps_fix,
        "ph": reading.ph,
        "turbidity_ntu": reading.turbidity_ntu,
        "temperature_c": reading.temperature_c,
        "h2s_ppm": reading.h2s_ppm,
        "timestamp": reading.timestamp.isoformat() if reading.timestamp.tzinfo else f"{reading.timestamp.isoformat()}Z",
        "pollution_label": reading.pollution_label,
        "pollution_score": reading.pollution_score,
        "alert_triggered": reading.alert_triggered,
    })

    return reading


@router.get("/history", response_model=List[SensorReadingOut])
async def get_history(
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_session)
):
    stmt = select(SensorReading).order_by(desc(SensorReading.timestamp)).limit(limit)
    result = await db.execute(stmt)
    records = result.scalars().all()
    return list(reversed(records))
