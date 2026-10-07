# CWPRS Water Quality Monitoring System - Master Guide

This document is your complete, authoritative guide to the actual codebase. It is designed to take you from a basic understanding to advanced technical mastery, strictly based on the code currently in your repository.

---

## 1. Project at a Glance
This project is an end-to-end IoT Water Quality Monitoring System. It uses an ESP32 microcontroller to continuously read data from physical water sensors (pH, Turbidity, Temperature, and MQ-135 for H₂S). The ESP32 logs this data locally to a CSV file and sends it over Wi-Fi to a Python backend (FastAPI). The backend saves the readings to an SQLite database and runs them through a pre-trained Machine Learning model (Random Forest) to predict if the water is "Safe" or "Not Safe". A React frontend dashboard receives these updates in real-time via WebSocket, instantly displaying live metrics, historical charts, system status alerts, and a direct MJPEG camera feed.

## 2. Explain It Like I'm New
**What problem are we solving?**
We need to know if water is safe or polluted instantly, without waiting for manual lab tests. 

**What have we built?**
A floating "sensor node" that reads water conditions continuously, and a web dashboard for operators to watch the data from a control room.

**How does the complete system work?**
Physical Water → Sensors convert properties to voltages → ESP32 turns voltages into numbers → Internet/Wi-Fi sends numbers to the server → Backend server processes data → Database stores it → Machine Learning evaluates safety → WebSocket shouts "New Data!" → Dashboard updates instantly for the user.

## 3. 30-Second Explanation
Hardware sensors measure pH, Turbidity, Temperature, and Gas. An ESP32 gathers these readings every second, and every 5 seconds POSTs them as JSON over Wi-Fi. A Python FastAPI backend receives the JSON, asks a Random Forest model if the water is safe, saves everything to a database, and broadcasts the result over a WebSocket. A React web app receives the broadcast and updates the user's dashboard without refreshing the page.

## 4. 2-Minute Explanation
1. **Hardware Node:** An ESP32 wired to a pH sensor (Pin 35), a turbidity sensor (Pin 32), a DS18B20 temp probe (Pin 26), and an MQ-135 gas sensor (Pin 34). 
2. **Firmware:** The C++ code reads these pins and GPS, converts sensor values into readable units, saves a backup to LittleFS (`water_data_gps.csv`), and sends an HTTP POST request to the server.
3. **Backend Logic:** The FastAPI server receives the HTTP request. It feeds the data into a Machine Learning model (`model.pkl`) to predict water safety. It also checks hardcoded limits (e.g., pH > 8.5) to trigger instant alerts.
4. **Data Delivery:** The server saves the record to an SQLite database. It then pushes the new reading through a continuous "WebSocket" connection to any open browsers.
5. **Frontend UI:** The React application catches the WebSocket message and instantly updates the `latest` variable in memory, causing the graphs and big numbers on the screen to change immediately.

## 5. 5-Minute Explanation
(Read through sections 6, 7, 10, and 21 to grasp the detailed 5-minute technical flow.)

## 6. Complete Architecture Map

| Component | What it is | Why we use it | Where used | Input | Output |
|-----------|------------|---------------|------------|-------|--------|
| **ESP32** | Microcontroller | Reads sensors, logs locally, and bridges the camera AP to the router. | Node | Sensor voltages, GPS | JSON HTTP POSTs; `WaterQuality_Robot` AP |
| **pH Sensor** | Analog probe | Measures water acidity. | ESP32 Pin 35 | Water H+ ions | 0-3.3V analog |
| **Turbidity** | Optical sensor | Measures water cloudiness. | ESP32 Pin 32 | Light scattering | 0-3.3V analog |
| **DS18B20** | Temp sensor | Measures water temperature. | ESP32 Pin 26 | Heat | 1-Wire Digital |
| **MQ-135** | Gas sensor | Used as a proxy for H₂S. | ESP32 Pin 34 | Dissolved gases | 0-3.3V analog |
| **ESP32-CAM** | Camera module | Optical feed of the water. | Node | Visual light | MJPEG stream |
| **FastAPI** | Python framework | Fast, modern way to build APIs. | Backend Server | JSON / WS | JSON / DB writes |
| **SQLite** | Local Database | Simple SQL database. | Backend Server | SQLAlchemy | Stored rows |
| **Random Forest**| ML Algorithm | Classifies if water is safe. | Backend Server | pH, Turbidity, H₂S | "Safe"/"Not Safe" |
| **React + Vite** | Frontend UI | Interactive dashboard. | User's Browser | WebSockets | Dashboard UI |
| **WebSocket** | Communication | Keeps connection open for pushes. | Server ↔ Browser | - | Real-time pushes |

## 7. Hardware
The sensor node uses Wi-Fi AP+STA mode. Its `WaterQuality_Robot` access point at `192.168.4.1` connects the ESP32-CAM, while its station connection sends readings to FastAPI. The node also reads GPS over UART and displays status on an OLED.

## 8. Sensors
*   **pH Sensor (Pin 35):** Measures acidity. Raw 0-4095 ADC. Converted via: `7.0 + ((2.5 - voltage) * 3.5)`. Expected range 0-14. 
*   **Turbidity Sensor (Pin 32):** Measures cloudiness. Raw 0-4095 ADC. Converted via: `-1120.4*(V^2) + 5742.3*V - 4353.8`. Expected range 0-3000 NTU.
*   **Temperature (Pin 26):** DS18B20 digital thermometer on a 1-Wire bus. Returns exact Celsius.
*   **MQ-135 (Pin 34):** Broad spectrum gas sensor, used here as an **H₂S proxy**. Raw 0-4095 ADC. Converted via: `(voltage / 3.3) * 5.0`. Expected range 0-500 ppm.

## 9. ESP32
*   **BOOT:** Mounts LittleFS and checks for `water_data_gps.csv`.
*   **WIFI CONNECTION:** Starts the camera access point and connects to the configured router in parallel.
*   **READ SENSOR:** `readSensors()` runs every 1 sec.
*   **PROCESS VALUE:** `convertToPH()`, `convertToTurbidity()`, etc., turn raw ADC to floats.
*   **CREATE TELEMETRY:** Packages variables into a JSON string.
*   **SEND TELEMETRY:** `postToServer()` runs every 5 sec, executing an HTTP POST to the backend. Also runs `saveCSV()` locally.

## 10. Communication
*   **HTTP/REST:** ESP32 uses `HTTPClient` to send data. Protocol chosen for simplicity and native FastAPI compatibility.
*   **WebSocket:** React maintains a `ws://` connection to FastAPI. Chosen so the server can *push* data, eliminating latency.
*   **HTTP MJPEG Stream:** React directly loads `http://192.168.4.2:81/stream` for video. The camera joins the sensor node's `WaterQuality_Robot` access point with static IP `192.168.4.2`.
*   **Failure:** If Wi-Fi fails, ESP32 stops HTTP but keeps saving to CSV. React auto-reconnects WS every 3 seconds if dropped.

## 11. Backend
*   **Routes:** `routers/ingest.py` (HTTP POST) and `routers/ws.py` (WebSocket).
*   **Flow:** ESP32 sends POST → `ingest.py` receives → Calls `predict_pollution()` → Calculates `alert_triggered` → Saves to `SensorReading` table → Calls `manager.broadcast()` → React receives.

## 12. Database
*   **What:** SQLite (`waterquality.db`).
*   **Why:** Serverless, file-based, perfect for lightweight IoT.
*   **Fields:** `id` (Auto), `timestamp` (DateTime), `device_id` (String), `ph` (Float), `turbidity_ntu` (Float), `temperature_c` (Float), `h2s_ppm` (Float), `pollution_label` (String), `pollution_score` (Float), `alert_triggered` (Boolean).

## 13. Machine Learning
*   **What:** Random Forest Classifier (`scikit-learn`). It builds many decision trees and takes majority vote.
*   **Features:** In training (`train.py`), it used `pH`, `Turbidity`, `Sulfate`. 
*   **How used:** The backend (`ml_service.py`) substitutes `Sulfate` with `h2s_ppm` when predicting. It predicts a label (1 = "Safe", 0 = "Not Safe") and extracts the probability (Confidence score).

## 14. Frontend
*   **Tech:** React + Vite, Tailwind CSS, Recharts.
*   **Pages:** `Dashboard.jsx`.
*   **State:** Uses `history` (array of readings) and `latest` (most recent reading).
*   **API Calls:** `GET /readings/history` on load. `WebSocket` for live updates.

## 15. Dashboard
*   **Data flow:** UI Element ↓ React `latest` state variable ↓ WebSocket event ↓ FastAPI `manager.broadcast` ↓ Database ↓ ESP32 JSON payload ↓ Hardware Sensor.
*   *Example:* Big pH number on screen is literally `latest.ph` from the WebSocket.

## 16. History
React fetches `GET /readings/history?limit=50` on load. This populates the `history` array. The `ReadingHistoryTable` and `SensorChart` components loop through this array to draw trends.

## 17. Camera
*   **Camera:** Separate ESP32-CAM module.
*   **Flow:** Camera → Local Network → Stream (`http://192.168.4.2:81/stream`) → Frontend `<img>` tag → User. 
*   The backend server is entirely bypassed for video.

## 18. Settings
Located in `SettingsPanel` inside `Dashboard.jsx`. It is purely UI-informational right now. It displays the connected `device_id` and the hardcoded threshold reference limits.

## 19. Status Logic
System status (`alert_triggered`) is calculated in the backend `ingest.py`.
An alert triggers if ANY are true:
1. pH < 6.5 or pH > 8.5
2. Turbidity > 4.0
3. H2S > 0.05
4. ML Label == "Not Safe"

## 20. Thresholds
*   **pH:** 6.5 - 8.5 pH
*   **Turbidity:** 0 - 4.0 NTU
*   **Temperature:** 10 - 30 °C (Note: Not actually checked in backend alert logic!)
*   **H₂S:** 0 - 0.05 ppm
*   *Configured in:* Backend `ingest.py` for logic, Frontend `SettingsPanel` for display.

## 21. Complete Data Flow
Physical water → pH sensor → analog voltage → ESP32 ADC pin 35 → `analogRead()` → `convertToPH()` → `phValue` float → `payload` JSON string → HTTP POST over Wi-Fi → FastAPI `ingest.py` → `predict_pollution()` → `alert_triggered` logic → SQLAlchemy `db.add()` → SQLite `waterquality.db` → WebSocket `broadcast()` → React `App.jsx` `onmessage` → `setLatest()` → UI re-render → User sees new pH.

## 22. File-by-File Explanation
*   `esp32_firmware_merged.ino`: Sensor-node firmware. Reads sensors and GPS, updates the OLED, logs `water_data_gps.csv`, and posts readings to FastAPI while hosting the camera access point.
*   `esp32_cam_firmware/esp32_cam_firmware.ino`: Separate ESP32-CAM sketch for the MJPEG stream and SD-card snapshots.
*   `backend/app/main.py`: FastAPI entrypoint. Starts server, mounts DB and routes.
*   `backend/app/routers/ingest.py`: Receives POST, does ML/Alert logic, saves to DB.
*   `backend/app/routers/ws.py`: Manages active WebSocket connections.
*   `backend/app/services/ml_service.py`: Loads `model.pkl` and runs `predict()`.
*   `frontend/src/App.jsx`: Main React file. Manages WebSocket connection and state.
*   `frontend/src/pages/Dashboard.jsx`: Layout for the UI, passes state to child cards.

## 23. Important Functions
*   `postToServer()` (Firmware): Formats and sends HTTP POST. Without it, no data reaches the server.
*   `saveCSV()` (Firmware): Saves backup to ESP32 flash memory.
*   `ingest_reading()` (Backend): Master controller for receiving data.
*   `predict_pollution()` (Backend): Bridges FastAPI with the Scikit-learn model.

## 24. Why Each Technology
*   **ESP32:** Built-in Wi-Fi, multiple ADCs, cheap.
*   **FastAPI:** Very fast Python framework, native support for async/WebSockets.
*   **React:** Component-based UI, easily handles high-frequency WebSocket state changes.
*   **WebSocket:** Required for zero-latency dashboard updates. HTTP polling would be too slow/heavy.

## 25. Error Handling
*   **ESP32 Wi-Fi fail:** `postToServer` skipped, logs to local CSV continue.
*   **Backend fail:** React WebSocket drops. Auto-reconnects every 3 seconds.
*   **Temp Sensor unplugged:** Reads `DEVICE_DISCONNECTED_C`, code forces it to `25.0`.

## 26. Limitations
*   **ML Feature Mismatch:** The model was trained on `Sulfate` but the inference uses `H₂S` as a proxy. This impacts real-world accuracy.
*   **Hardcoded IP:** The camera IP is hardcoded/manual in the UI (`192.168.4.2`).
*   **Single Device:** The system currently assumes one primary device (`ESP32-001`).

## 27. Future Improvements
*   Train a new ML model specifically on H₂S instead of Sulfate.
*   Add two-way communication so the dashboard can change ESP32 settings remotely.
*   Migrate from SQLite to PostgreSQL for massive long-term data storage.

## 28. Viva Questions
**"Explain your project."**
It's an IoT water monitoring system using an ESP32 to read sensors, a Python FastAPI backend to process and run Machine Learning predictions, and a React dashboard updated in real-time via WebSockets.

**"Why WebSocket?"**
It allows the server to push data to the browser the millisecond it arrives. Standard HTTP would require the browser to constantly spam the server asking for updates.

**"What happens if Wi-Fi fails?"**
The ESP32 utilizes LittleFS to locally log sensor readings and GPS status to `water_data_gps.csv`, including while the router connection is unavailable.

## 29. Interview Questions
**Basic:** What sensors are you using? (pH, Turbidity, Temp DS18B20, MQ-135).
**Intermediate:** How do you handle missing sensor readings? (Code falls back to safe defaults, e.g., Temp = 25.0 if disconnected).
**Advanced:** Tell me about your ML pipeline. (Random Forest trained on water potability CSV, deployed as a `.pkl` pipeline via Joblib, loaded into FastAPI memory).
**Tricky:** Does your ML model directly measure Sulfate? (No, we use MQ-135 to measure H₂S as a hardware proxy for sulfur-based compounds).

## 30. Don't Say This
*   ❌ *"The ESP32 sends data directly to the database."* (It sends an HTTP POST to FastAPI, which does the DB write).
*   ❌ *"The frontend calculates if the water is safe."* (The backend calculates it, frontend just displays).
*   ❌ *"The camera video goes through our FastAPI server."* (React connects directly to the camera IP).
*   ❌ *"Temperature fluctuations trigger alerts."* (Temperature is logged but not included in `ingest.py` alert logic).

## 31. Cheat Sheet
*   **Hardware:** ESP32, pH(35), Turb(32), Temp(26), Gas(34).
*   **Stack:** C++ (Firmware), Python/FastAPI (Backend), React (Frontend), SQLite (DB).
*   **Communication:** HTTP POST (ESP32→Server), WebSocket (Server→Browser).
*   **ML:** Random Forest (Safe/Not Safe).
*   **Thresholds:** pH (6.5-8.5), Turb (0-4.0), H2S (0-0.05).
*   **Alerts:** Triggered if ANY threshold is broken, OR if ML says "Not Safe".

## 32. Glossary
*   **Telemetry:** Automated remote data transmission.
*   **ADC:** Analog-to-Digital Converter.
*   **JSON:** Standard text format for data exchange.
*   **WebSocket:** Persistent two-way network connection.
*   **Proxy Feature:** Using an available sensor (H₂S) to represent a missing one (Sulfate) for ML.

## 33. Documentation Gaps
*   *Not verified in repository:* Exact calibration fluid values used for the pH sensor. The code uses `7.0 + ((2.5 - voltage) * 3.5)` as a baseline, but physical calibration requires checking the physical probe with buffer solutions.
