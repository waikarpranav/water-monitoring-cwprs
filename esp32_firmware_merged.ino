// =====================================================
// ESP32 WATER QUALITY SENSOR NODE (MERGED FIRMWARE)
// =====================================================
// Target Board: ESP32 Dev Module
// Integrates with: FastAPI Backend (POST /readings/) + LCD + LittleFS
// =====================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <LittleFS.h>
#include <TinyGPSPlus.h>

// =====================================================
// PIN DEFINITIONS
// =====================================================

#define PH_PIN          35
#define TURBIDITY_PIN   32
#define TEMP_PIN        26
#define MQ135_PIN       34

#define I2C_SDA         21
#define I2C_SCL         22
#define GPS_RX          16
#define GPS_TX          17

// =====================================================
// NETWORK & SERVER CONFIGURATION
// =====================================================

// Configure your local Wi-Fi credentials:
const char* WIFI_SSID     = "VTX520_2.4G";
const char* WIFI_PASSWORD = "avenger001";
const char* CAMERA_AP_SSID = "WaterQuality_Robot";
const char* CAMERA_AP_PASSWORD = "12345678";

// FastAPI Server Ingestion Endpoint (adjust IP to your laptop/server)
const char* SERVER_URL    = "http://192.168.1.100:8000/readings/";
const char* DEVICE_ID     = "ESP32-001";

// =====================================================
// OBJECTS & SENSORS
// =====================================================

Adafruit_SSD1306 display(128, 64, &Wire, -1);
HardwareSerial GPSserial(2);
TinyGPSPlus gps;

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
bool gpsFix = false;
double latitude = 0.0;
double longitude = 0.0;

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
  if (!LittleFS.exists("/water_data_gps.csv")) {
    File file = LittleFS.open("/water_data_gps.csv", FILE_WRITE);
    if (file) {
      file.println("S.No,pH_Raw,pH_Val,Turb_Raw,Turb_NTU,Temp_C,MQ135_Raw,H2S_PPM,Time,Latitude,Longitude,GPS_Fix");
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

  File file = LittleFS.open("/water_data_gps.csv", FILE_APPEND);
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
  file.print(timeString);   file.print(",");
  if (gpsFix) {
    file.print(latitude, 6); file.print(",");
    file.print(longitude, 6);
  } else {
    file.print(",");
  }
  file.print(",");
  file.println(gpsFix ? "1" : "0");

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
// OLED DISPLAY UPDATE
// =====================================================

void updateOLED() {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);

  display.setCursor(0, 0);
  display.println("WATER QUALITY");
  display.setCursor(0, 11);
  display.print("pH: ");
  display.println(phValue, 2);
  display.setCursor(0, 21);
  display.print("Turb: ");
  display.print(turbidityNTU, 1);
  display.println(" NTU");
  display.setCursor(0, 31);
  display.print("Temp: ");
  display.print(temperatureC, 1);
  display.println(" C");
  display.setCursor(0, 41);
  display.print("MQ135: ");
  display.println(mq135Raw);
  display.setCursor(0, 51);
  display.print("GPS: ");
  display.println(gpsFix ? "FIX" : "Searching");

  display.display();
}

void readGPS() {
  while (GPSserial.available()) {
    gps.encode(GPSserial.read());
  }

  gpsFix = gps.location.isValid() && gps.location.age() < 5000;
  if (gpsFix) {
    latitude = gps.location.lat();
    longitude = gps.location.lng();
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
  payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"ph\":" + String(phValue, 2) + ",";
  payload += "\"turbidity_ntu\":" + String(turbidityNTU, 2) + ",";
  payload += "\"temperature_c\":" + String(temperatureC, 2) + ",";
  payload += "\"h2s_ppm\":" + String(h2sPPM, 4) + ",";
  payload += "\"gps_fix\":" + String(gpsFix ? "true" : "false") + ",";
  payload += "\"latitude\":";
  payload += gpsFix ? String(latitude, 6) : "null";
  payload += ",\"longitude\":";
  payload += gpsFix ? String(longitude, 6) : "null";
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

  // I2C & OLED
  Wire.begin(I2C_SDA, I2C_SCL);
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("WATER QUALITY");
    display.println("Starting node...");
    display.display();
  }

  // Temperature sensor
  ds18b20.begin();
  GPSserial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  // LittleFS local logging
  if (!LittleFS.begin(true)) {
    Serial.println("[FS] LittleFS mount failed!");
  } else {
    Serial.println("[FS] LittleFS ready.");
    createCSV();
  }

  // Keep the camera access point active while joining the router for FastAPI.
  WiFi.mode(WIFI_AP_STA);
  IPAddress cameraAPIP(192, 168, 4, 1);
  IPAddress cameraSubnet(255, 255, 255, 0);
  WiFi.softAPConfig(cameraAPIP, cameraAPIP, cameraSubnet);
  if (WiFi.softAP(CAMERA_AP_SSID, CAMERA_AP_PASSWORD)) {
    Serial.print("[WIFI] Camera access point: http://");
    Serial.println(WiFi.softAPIP());
  } else {
    Serial.println("[WIFI] Camera access point failed to start.");
  }

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

    Serial.print("[WIFI] Camera AP remains available at ");
    Serial.println(WiFi.softAPIP());
  } else {
    Serial.println("[WIFI] Could not connect to AP. Will retry in loop.");
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

  readGPS();

  // Read sensors and refresh OLED every 1 sec
  if (now - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = now;
    readSensors();
    updateOLED();
  }

  // Log to local LittleFS CSV and POST to FastAPI backend every 5 sec
  if (now - lastLog >= LOG_INTERVAL) {
    lastLog = now;
    saveCSV();
    postToServer();
  }
}
