from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class SensorReadingIn(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=50)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    gps_fix: bool = False
    ph: float = Field(..., ge=0.0, le=14.0)
    turbidity_ntu: float = Field(..., ge=0.0, le=3000.0)
    temperature_c: float = Field(..., ge=-5.0, le=100.0)
    h2s_ppm: float = Field(..., ge=0.0, le=500.0)
    timestamp: Optional[datetime] = None


class SensorReadingOut(SensorReadingIn):
    id: int
    timestamp: datetime
    pollution_label: str
    pollution_score: float
    alert_triggered: bool = False

    class Config:
        from_attributes = True