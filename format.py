import codecs
import re
import os

artifact_plan = 'C:/Users/Pranav/.gemini/antigravity/brain/2bb78b00-dbca-4484-8af8-01145d2653fc/implementation_plan.md'
vault_plan = 'C:/Users/Pranav/Documents/PRANAV WORKSPACE/CWRPS PROJECT/implementation_plan.md'
vault_index = 'C:/Users/Pranav/Documents/PRANAV WORKSPACE/CWRPS PROJECT/index.md'

# 1. Format Implementation Plan
with codecs.open(artifact_plan, 'r', encoding='utf-8') as f:
    plan_text = f.read()

# Enhance Implementation Plan
plan_text = re.sub(r'^## 1\. ', '## 🗄️ 1. ', plan_text, flags=re.MULTILINE)
plan_text = re.sub(r'^## 2\. ', '## 📁 2. ', plan_text, flags=re.MULTILINE)
plan_text = re.sub(r'^## 3\. ', '## 🧩 3. ', plan_text, flags=re.MULTILINE)
plan_text = re.sub(r'^## 4\. ', '## 📅 4. ', plan_text, flags=re.MULTILINE)
plan_text = re.sub(r'^## 5\. ', '## ⚠️ 5. ', plan_text, flags=re.MULTILINE)
plan_text = re.sub(r'^## 6\. ', '## 🐳 6. ', plan_text, flags=re.MULTILINE)
plan_text = re.sub(r'^## 7\. ', '## 📦 7. ', plan_text, flags=re.MULTILINE)
plan_text = re.sub(r'^## Open Questions / Decisions Needed', '## ❓ Open Questions / Decisions Needed', plan_text, flags=re.MULTILINE)
plan_text = re.sub(r'^## Phase 2 Preview', '## 🔮 Phase 2 Preview', plan_text, flags=re.MULTILINE)

# Ensure Obsidian callouts are standard case
plan_text = plan_text.replace('> [!IMPORTANT]', '> [!important]')
plan_text = plan_text.replace('> [!WARNING]', '> [!warning]')
plan_text = plan_text.replace('> [!NOTE]', '> [!note]')

with codecs.open(vault_plan, 'w', encoding='utf-8') as f:
    f.write(plan_text)

# 2. Format Index
index_text = """# 🌊 CWRPS — IoT Water Quality Monitoring System

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
curl -X POST http://localhost:8000/readings -H "Content-Type: application/json" -d "{\"device_id\":\"ESP32-001\",\"ph\":7.2,\"turbidity_ntu\":3.1,\"temperature_c\":24.5,\"h2s_ppm\":0.02}"
`
"""
with codecs.open(vault_index, 'w', encoding='utf-8') as f:
    f.write(index_text)

print('Success')

ino_code = """// =====================================================
// ESP32 WATER QUALITY SENSOR NODE (MERGED FIRMWARE)
// =====================================================
// Target Board: ESP32 Dev Module
// Integrates with: FastAPI Backend (POST /readings/) + LCD + LittleFS
// =====================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <LittleFS.h>

// =====================================================
// PIN DEFINITIONS
// =====================================================

#define PH_PIN          35
#define TURBIDITY_PIN   32
#define TEMP_PIN        26
#define MQ135_PIN       34

#define I2C_SDA         21
#define I2C_SCL         22

// =====================================================
// NETWORK & SERVER CONFIGURATION
// =====================================================

// Configure your local Wi-Fi credentials:
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// FastAPI Server Ingestion Endpoint (adjust IP to your laptop/server)
const char* SERVER_URL    = "http://192.168.1.100:8000/readings/";
const char* DEVICE_ID     = "ESP32-001";

// =====================================================
// OBJECTS & SENSORS
// =====================================================

LiquidCrystal_I2C lcd(0x27, 16, 2);

OneWire oneWire(TEMP_PIN);
DallasTemperature ds18b20(&oneWire);

// =====================================================
// SENSOR VARIABLES
// =====================================================

int phRaw = 0;
int turbidityRaw = 0;
int mq135Raw = 0;

float phValue = 7.0;
float turbidityNTU = 0.0;
float temperatureC = 0.0;
float h2sPPM = 0.0;

// =====================================================
// TIMING
// =====================================================

unsigned long lastSensorRead = 0;
unsigned long lastLog        = 0;

const unsigned long SENSOR_INTERVAL = 1000; // Read sensors + LCD every 1 sec
const unsigned long LOG_INTERVAL    = 5000; // Log to CSV + HTTP POST every 5 sec

// =====================================================
// LOCAL CSV BACKUP (LITTLEFS)
// =====================================================

unsigned long serialNumber = 0;

void createCSV() {
  if (!LittleFS.exists("/water_data.csv")) {
    File file = LittleFS.open("/water_data.csv", FILE_WRITE);
    if (file) {
      file.println("S.No,pH_Raw,pH_Val,Turb_Raw,Turb_NTU,Temp_C,MQ135_Raw,H2S_PPM,Time");
      file.close();
      Serial.println("[FS] CSV file created.");
    }
  }
}

void saveCSV() {
  serialNumber++;
  unsigned long totalSeconds = millis() / 1000;
  unsigned long minutes = totalSeconds / 60;
  unsigned long seconds = totalSeconds % 60;

  char timeString[12];
  snprintf(timeString, sizeof(timeString), "%02lu:%02lu", minutes, seconds);

  File file = LittleFS.open("/water_data.csv", FILE_APPEND);
  if (!file) {
    Serial.println("[FS] CSV append open failed!");
    return;
  }

  file.print(serialNumber); file.print(",");
  file.print(phRaw);        file.print(",");
  file.print(phValue, 2);   file.print(",");
  file.print(turbidityRaw); file.print(",");
  file.print(turbidityNTU, 2); file.print(",");
  file.print(temperatureC, 2); file.print(",");
  file.print(mq135Raw);     file.print(",");
  file.print(h2sPPM, 3);    file.print(",");
  file.println(timeString);

  file.close();
  Serial.print("[FS] Logged CSV record: #");
  Serial.println(serialNumber);
}

// =====================================================
// CALIBRATION & SENSOR CONVERSIONS
// =====================================================

// pH Sensor (PH-4502C or standard analog probe)
// Standard 12-bit ADC (0 - 4095) at 3.3V attenuation
float convertToPH(int raw) {
  float voltage = (raw / 4095.0f) * 3.3f;
  // Linear calibration: 2.5V = pH 7.0; adjust slope/offset for specific probe buffer
  float ph = 7.0f + ((2.5f - voltage) * 3.5f);
  if (ph < 0.0f) ph = 0.0f;
  if (ph > 14.0f) ph = 14.0f;
  return ph;
}

// Turbidity Sensor (SEN0189 / standard optical probe)
// Raw ADC drops as water gets cloudier
float convertToTurbidity(int raw) {
  float voltage = (raw / 4095.0f) * 3.3f;
  float ntu = 0.0f;
  if (voltage < 2.5f) {
    ntu = 3000.0f;
  } else {
    ntu = -1120.4f * (voltage * voltage) + 5742.3f * voltage - 4353.8f;
  }
  if (ntu < 0.0f) ntu = 0.0f;
  if (ntu > 3000.0f) ntu = 3000.0f;
  return ntu;
}

// MQ-135 Gas Sensor (proxy for H2S / dissolved air quality)
float convertToH2S(int raw) {
  float voltage = (raw / 4095.0f) * 3.3f;
  float ppm = (voltage / 3.3f) * 5.0f;
  if (ppm < 0.0f) ppm = 0.0f;
  if (ppm > 500.0f) ppm = 500.0f;
  return ppm;
}

// =====================================================
// SENSOR READ FUNCTION
// =====================================================

void readSensors() {
  phRaw        = analogRead(PH_PIN);
  turbidityRaw = analogRead(TURBIDITY_PIN);
  mq135Raw     = analogRead(MQ135_PIN);

  ds18b20.requestTemperatures();
  temperatureC = ds18b20.getTempCByIndex(0);

  if (temperatureC == DEVICE_DISCONNECTED_C || temperatureC < -5.0f) {
    temperatureC = 25.0f; // Default fallback if probe is disconnected
  }

  // Compute calibrated values
  phValue      = convertToPH(phRaw);
  turbidityNTU = convertToTurbidity(turbidityRaw);
  h2sPPM       = convertToH2S(mq135Raw);

  Serial.print("[SENSORS] pH: ");
  Serial.print(phValue, 2);
  Serial.print(" ("); Serial.print(phRaw); Serial.print(")");
  Serial.print(" | Turb NTU: ");
  Serial.print(turbidityNTU, 1);
  Serial.print(" | Temp: ");
  Serial.print(temperatureC, 1);
  Serial.print(" C | H2S: ");
  Serial.print(h2sPPM, 3);
  Serial.println(" ppm");
}

// =====================================================
// LCD DISPLAY UPDATE (cycles screens every second)
// =====================================================

void updateLCD() {
  static bool screen = false;
  screen = !screen;
  lcd.clear();

  if (!screen) {
    lcd.setCursor(0, 0);
    lcd.print("pH:");
    lcd.print(phValue, 1);

    lcd.setCursor(9, 0);
    lcd.print("T:");
    lcd.print(temperatureC, 1);

    lcd.setCursor(0, 1);
    lcd.print("Turb:");
    lcd.print((int)turbidityNTU);
    lcd.print(" NTU");
  } else {
    lcd.setCursor(0, 0);
    lcd.print("H2S:");
    lcd.print(h2sPPM, 2);
    lcd.print(" ppm");

    lcd.setCursor(0, 1);
    if (WiFi.status() == WL_CONNECTED) {
      lcd.print("WiFi: OK (STA)");
    } else {
      lcd.print("WiFi: Conn...");
    }
  }
}

// =====================================================
// HTTP POST TO FASTAPI INGESTION ENDPOINT
// =====================================================

void postToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi not connected. Skipping server POST.");
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON matching Pydantic SensorReadingIn schema:
  // {
  //   "device_id": "ESP32-001",
  //   "ph": 7.2,
  //   "turbidity_ntu": 2.5,
  //   "temperature_c": 24.3,
  //   "h2s_ppm": 0.015
  // }
  String payload = "{";
  payload += "\\\"device_id\\\":\\\"" + String(DEVICE_ID) + "\\\",";
  payload += "\\\"ph\\\":\" + String(phValue, 2) + \",\";
  payload += "\\\"turbidity_ntu\\\":\" + String(turbidityNTU, 2) + \",\";
  payload += "\\\"temperature_c\\\":\" + String(temperatureC, 2) + \",\";
  payload += "\\\"h2s_ppm\\\":\" + String(h2sPPM, 4);
  payload += "}";

  Serial.print("[HTTP] POSTing to ");
  Serial.print(SERVER_URL);
  Serial.print(": ");
  Serial.println(payload);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    Serial.print("[HTTP] Response code: ");
    Serial.println(httpCode);
    if (httpCode == HTTP_CODE_CREATED || httpCode == HTTP_CODE_OK) {
      String response = http.getString();
      Serial.print("[HTTP] Response body: ");
      Serial.println(response);
    }
  } else {
    Serial.print("[HTTP] Error sending POST: ");
    Serial.println(http.errorToString(httpCode).c_str());
  }

  http.end();
}

// =====================================================
// SETUP
// =====================================================

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("==============================================");
  Serial.println("   Water Quality Robot - Sensor Node Ingest   ");
  Serial.println("==============================================");

  analogReadResolution(12);

  // ADC attenuation (0 - 3.3V range)
  analogSetPinAttenuation(PH_PIN, ADC_11db);
  analogSetPinAttenuation(TURBIDITY_PIN, ADC_11db);
  analogSetPinAttenuation(MQ135_PIN, ADC_11db);

  // I2C & LCD
  Wire.begin(I2C_SDA, I2C_SCL);
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Water Quality");
  lcd.setCursor(0, 1);
  lcd.print("Starting node...");

  // Temperature sensor
  ds18b20.begin();

  // LittleFS local logging
  if (!LittleFS.begin(true)) {
    Serial.println("[FS] LittleFS mount failed!");
  } else {
    Serial.println("[FS] LittleFS ready.");
    createCSV();
  }

  // Connect to Wi-Fi in Station Mode (STA)
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[WIFI] Connecting to ");
  Serial.println(WIFI_SSID);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[WIFI] Connected! Assigned IP: ");
    Serial.println(WiFi.localIP());

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
  } else {
    Serial.println("[WIFI] Could not connect to AP. Will retry in loop.");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Timeout");
    lcd.setCursor(0, 1);
    lcd.print("Retrying in loop");
  }

  delay(1500);
}

// =====================================================
// MAIN LOOP
// =====================================================

void loop() {
  unsigned long now = millis();

  // Reconnect Wi-Fi if connection is lost
  if (WiFi.status() != WL_CONNECTED && (now % 10000 < 50)) {
    WiFi.reconnect();
  }

  // Read sensors and refresh LCD display every 1 sec
  if (now - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = now;
    readSensors();
    updateLCD();
  }

  // Log to local LittleFS CSV and POST to FastAPI backend every 5 sec
  if (now - lastLog >= LOG_INTERVAL) {
    lastLog = now;
    saveCSV();
    postToServer();
  }
}
"""

with codecs.open('esp32_firmware_merged.ino', 'w', encoding='utf-8') as f:
    f.write(ino_code)

print('Generated esp32_firmware_merged.ino successfully')

