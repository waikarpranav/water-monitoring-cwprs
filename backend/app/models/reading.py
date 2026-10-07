from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime, timezone

class Base(DeclarativeBase):
    pass

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    timestamp       = Column(DateTime(timezone=True), nullable=False,
                              default=lambda: datetime.now(timezone.utc), index=True)
    device_id       = Column(String(50), nullable=False, index=True)
    latitude        = Column(Float, nullable=True)
    longitude       = Column(Float, nullable=True)
    gps_fix         = Column(Boolean, nullable=False, default=False, server_default="0")
    ph              = Column(Float, nullable=False)
    turbidity_ntu   = Column(Float, nullable=False)
    temperature_c   = Column(Float, nullable=False)
    h2s_ppm         = Column(Float, nullable=False)
    pollution_label = Column(String(20), nullable=True)
    pollution_score = Column(Float, nullable=True)
    alert_triggered = Column(Boolean, default=False)