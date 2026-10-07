# 🌊 CWRPS — IoT Water Quality Monitoring System

> [!info] Project Overview
> **Type**: B.E. Final Year Project
> **Stack**: ESP32 · FastAPI · TimescaleDB · scikit-learn · React
> **Team size**: 3 people · Part-time alongside coursework
> **Estimated duration**: 8 weeks

---

## 📋 Project Status

| Phase | Status | Target Week |
|---|---|---|
| Phase 1 — Foundation (DB + Ingest API) | ⬜ Not started | Week 1–2 |
| Phase 1 — ML Pipeline (Random Forest) | ⬜ Not started | Week 3 |
| Phase 1 — React Dashboard + WebSocket | ⬜ Not started | Week 4–5 |
| Phase 1 — Alerting + LAN Deployment | ⬜ Not started | Week 6 |
| Phase 1 — Polish & Report | ⬜ Not started | Week 7–8 |
| Phase 2 — Camera (Planning only) | 📝 Planned | Post-submission |

> [!note] Status Key
> ⬜ Not started · 🔵 In progress · ✅ Done · 🔴 Blocked

---

## 🗂️ Notes in This Vault

| Note | Description |
|---|---|
| [[implementation_plan]] | Full technical implementation plan (Phase 1 + Phase 2 preview) |
| [[index]] | This file — project home & navigation hub |

---

## ✅ Key Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| **Backend framework** | FastAPI (Python) | Async, Pydantic validation, auto OpenAPI docs |
| **Database** | PostgreSQL + TimescaleDB | SQL + time-series hypertables; runs in Docker |
| **ESP32 → Backend transport** | HTTP POST (JSON) | Simplest for ESP32 HTTPClient; no broker needed |
| **Real-time dashboard** | WebSocket (not polling) | Lower latency, no DB hammering |
| **Frontend** | React + Vite + Recharts | Vite proxy eliminates CORS in dev |
| **ML model** | Random Forest (scikit-learn) | < 5 ms inference, no GPU, loads at startup |
| **Training dataset** | UCI Water Potability CSV | Real measurement distributions + WHO label cuts |
| **Deployment target** | ✅ Localhost / College LAN | No TLS/HTTPS needed; plain HTTP on LAN is fine |
| **Alerting** | Twilio SMS via FastAPI BackgroundTask | No Celery needed for Phase 1 I/O workloads |
| **Phase 2 camera model** | MobileNetV2 (transfer learning) | 14 MB, ~300 ms CPU inference, Colab-trainable |

---

## 🧭 Implementation Plan — Section Index

### 🚀 Phase 1

| Section | Topic |
|---|---|
| [§1 — Database Choice](implementation_plan.md#1-database-recommendation-postgresql--timescaledb) | Why TimescaleDB; comparison table |
| [§2 — Folder Structure](implementation_plan.md#2-full-project--folder-structure) | Full backend + frontend + ML directory tree |
| [§3a — Pydantic Schemas & Ingest Endpoint](implementation_plan.md#3a-pydantic-schemas--ingestion-endpoint) | SensorReadingIn, SensorReadingOut, POST /readings |
| [§3b — Database Schema](implementation_plan.md#3b-database-schema-timescaledb) | ORM models, hypertable SQL, async session |
| [§3c — ML Pipeline](implementation_plan.md#3c-ml-pollution-scoring-random-forest) | UCI dataset mapping, labeling strategy, training script, serving |
| [§3d — React Dashboard](implementation_plan.md#3d-react-dashboard) | WebSocket hook, component tree, Vite proxy |
| [§3e — Alerting](implementation_plan.md#3e-alerting-twilio-sms) | Twilio SMS, threshold logic, cooldown |
| [§4 — Build Order](implementation_plan.md#4-build--test-order-with-time-estimates) | 5-phase timeline with hours and milestones |
| [§5 — Integration Risks](implementation_plan.md#5-integration-risks--mitigations) | LAN deployment, CORS, RTC, sensor warm-up |
| [§6 — docker-compose](implementation_plan.md#6-docker-composeyml-quick-start) | Full compose file (TimescaleDB + backend + frontend) |
| [§7 — requirements.txt](implementation_plan.md#7-requirementstxt-backend) | All Python dependencies pinned |

### 🔮 Phase 2 (Planning Only)

| Section | Topic |
|---|---|
| [§8a — Transport Changes](implementation_plan.md#8a-transport--image-payload-vs-sensor-json) | JSON vs multipart/form-data; bandwidth comparison |
| [§8b — ESP32-CAM Constraints](implementation_plan.md#8b-esp32-cam-constraints) | PSRAM, QVGA resolution, POST reliability, power |
| [§8c — Storage Changes](implementation_plan.md#8c-storage--object-storage--db-column) | MinIO + new image_readings table |
| [§8d — CNN vs RF Pipeline](implementation_plan.md#8d-ml-pipeline--cnn-image-classifier-vs-random-forest) | MobileNetV2, inference latency, serving strategy |
| [§9 — Image Dataset Sourcing](implementation_plan.md#9-water-quality-image-dataset--where-to-source-and-label) | Label Studio, augmentation, Kaggle sources |
| [§10 — Phase 1 Compatibility Audit](implementation_plan.md#10-additive-compatibility-with-phase-1--what-needs-revisiting) | What changes, what stays the same |
| [§11 — Phase 2 Folder Additions](implementation_plan.md#11-phase-2-folder-structure-additions) | New files only |
| [§12 — Phase 2 Risk Table](implementation_plan.md#12-phase-2-risk-table) | Dataset, Celery, ESP32-CAM, MinIO risks |

---

## ⚡ Quick Reference

### 📡 Sensor Pinout (ESP32)

| Sensor | Module | ESP32 Pin | Interface |
|---|---|---|---|
| pH | PH-4502C | GPIO34 | Analog ADC |
| Turbidity | SEN0189 | GPIO35 | Analog ADC |
| Temperature | DS18B20 | GPIO4 | 1-Wire (digital) |
| Gas (H₂S) | MQ-136 | GPIO32 | Analog ADC |
| Display | OLED 0.96" | GPIO21 (SDA), GPIO22 (SCL) | I2C |
| Power | LM2596 Buck | VIN | 7.4V/12V → 5V |

### 🌐 API Endpoints (Phase 1)

| Method | Path | Description |
|---|---|---|
| POST | /readings | ESP32 ingests a sensor reading |
| GET | /readings | Historical readings (paginated + time filter) |
| GET | /readings/latest | Most recent reading per device |
| WS | /ws/live | WebSocket live stream for React dashboard |

### 🧪 Pollution Label Thresholds (WHO/CPCB)

| Label | pH | Turbidity (NTU) | H₂S (ppm) | Temp (°C) |
|---|---|---|---|---|
| **Good** | 6.5 – 8.5 | < 4 | < 0.05 | 10 – 30 |
| **Moderate** | 6.0 – 9.0 | 4 – 25 | 0.05 – 1 | 30 – 40 |
| **Poor** | 5.0 – 10.0 | 25 – 100 | 1 – 10 | > 40 |
| **Hazardous** | < 5 or > 10 | > 100 | > 10 | — |

### 🚨 Alert Triggers (Twilio SMS)

| Sensor | Critical Threshold | Cooldown |
|---|---|---|
| pH | < 5.0 or > 10.0 | 15 min / device |
| Turbidity | > 100 NTU | 15 min / device |
| H₂S | > 10 ppm | 15 min / device |
| Temperature | > 45 °C | 15 min / device |

### 💻 LAN Deployment Checklist

- [ ] Assign **static IP** to demo laptop (e.g. 192.168.1.100)
- [ ] Hardcode that IP in ESP32 firmware (serverURL = "http://192.168.1.100:8000/readings")
- [ ] FastAPI CORS: origins=["http://localhost:3000", "http://127.0.0.1:3000"]
- [ ] Docker Desktop running with >= 2 GB RAM allocated
- [ ] TimescaleDB container healthy before starting backend
- [ ] uvicorn app.main:app --host 0.0.0.0 --port 8000 (not 127.0.0.1)
- [ ] MQ-136 sensor powered >= 24 hr before demo for burn-in

---

## 🔗 Dependency Chain

`mermaid
flowchart TD
    A[TimescaleDB running & hypertable created] --> B[FastAPI ingest endpoint POST /readings]
    B --> C[UCI dataset downloaded → model.pkl trained]
    C --> D[WebSocket /ws/live endpoint + broadcast]
    D --> E[React: useWebSocket hook → LiveReadingsCard]
    E --> F[Twilio alert_service.py BackgroundTask]
    F --> G[LAN deployment: static IP, --host 0.0.0.0]
`

> [!warning] Development Sequencing Rule
> **Nothing frontend can be tested until** the ingest endpoint is live and returning valid SensorReadingOut JSON. Use curl or the FastAPI /docs Swagger UI to simulate ESP32 POSTs during frontend development.

---

## 📦 Dataset

- **Name**: UCI Water Potability Dataset
- **Source**: [Kaggle — adityakadiwal/water-potability](https://www.kaggle.com/datasets/adityakadiwal/water-potability)
- **File**: ackend/app/ml/dataset/water_potability.csv
- **Rows**: 3,276 · **Columns**: 9 (ph, Hardness, Solids, Chloramines, Sulfate, Conductivity, Organic_carbon, Trihalomethanes, Turbidity) + Potability
- **Features used**: ph, Turbidity (direct), Sulfate (proxy for H₂S/MQ-136)
- **Label strategy**: 4-class (Good/Moderate/Poor/Hazardous) derived via WHO threshold cuts applied to UCI rows

---

## 🛠️ Local Dev Quick Start

`ash
# 1. Start database
docker compose up db -d

# 2. Wait for TimescaleDB to be healthy, then run migrations
cd backend
alembic upgrade head

# 3. Convert table to hypertable (once)
psql postgresql://wquser:wqpass@localhost:5432/waterquality -c "SELECT create_hypertable('sensor_readings', 'timestamp', if_not_exists => TRUE);"

# 4. Train ML model (run once)
python app/ml/train.py

# 5. Start backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 6. Start React frontend (new terminal)
cd ../frontend
npm install && npm run dev

# 7. Simulate an ESP32 POST to verify end-to-end
curl -X POST http://localhost:8000/readings -H "Content-Type: application/json" -d "{"device_id":"ESP32-001","ph":7.2,"turbidity_ntu":3.1,"temperature_c":24.5,"h2s_ppm":0.02}"
`
