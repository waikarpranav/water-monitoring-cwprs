#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>
#include "FS.h"
#include "SD_MMC.h"

// ------------ WIFI ------------
const char* WIFI_SSID = "WaterQuality_Robot";
const char* WIFI_PASS = "12345678";

// ------------ AI THINKER CAMERA PINS ------------
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

IPAddress localIP(192, 168, 4, 2);
IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

WebServer server(80);
WiFiServer streamServer(81);

// ------------ CAPTURE AND SAVE ------------
void handleCapture() {
  camera_fb_t* frame = esp_camera_fb_get();
  if (!frame) {
    server.send(500, "text/plain", "Camera capture failed");
    return;
  }

  String path = "/IMG_" + String(millis()) + ".jpg";
  File file = SD_MMC.open(path, FILE_WRITE);
  bool saved = false;

  if (file) {
    size_t written = file.write(frame->buf, frame->len);
    file.close();
    saved = written == frame->len;
  }

  if (!saved) {
    esp_camera_fb_return(frame);
    server.send(500, "text/plain", "SD card save failed");
    return;
  }

  WiFiClient client = server.client();
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Content-Disposition", "inline; filename=" + path);
  server.sendHeader("Cache-Control", "no-store");
  server.setContentLength(frame->len);
  server.send(200, "image/jpeg", "");
  client.write(frame->buf, frame->len);
  esp_camera_fb_return(frame);
}

// ------------ STREAM TASK ------------
void streamTask(void* parameter) {
  streamServer.begin();
  streamServer.setNoDelay(true);

  for (;;) {
    WiFiClient client = streamServer.available();
    if (!client) {
      vTaskDelay(pdMS_TO_TICKS(10));
      continue;
    }

    client.setNoDelay(true);

    unsigned long timeout = millis() + 1500;
    while (client.connected() && !client.available() && millis() < timeout) {
      vTaskDelay(pdMS_TO_TICKS(2));
    }

    while (client.available()) {
      String line = client.readStringUntil('\n');
      if (line == "\r" || line.length() == 0) break;
    }

    if (!client.connected()) {
      client.stop();
      continue;
    }

    client.print(
      "HTTP/1.1 200 OK\r\n"
      "Content-Type: multipart/x-mixed-replace; boundary=frame\r\n"
      "Access-Control-Allow-Origin: *\r\n"
      "Cache-Control: no-cache\r\n"
      "Connection: keep-alive\r\n\r\n"
    );

    while (client.connected()) {
      camera_fb_t* frame = esp_camera_fb_get();
      if (!frame) {
        vTaskDelay(pdMS_TO_TICKS(50));
        continue;
      }

      char header[128];
      int headerLength = snprintf(header, sizeof(header),
        "--frame\r\n"
        "Content-Type: image/jpeg\r\n"
        "Content-Length: %u\r\n\r\n",
        static_cast<unsigned int>(frame->len));

      bool sent = client.write(
        reinterpret_cast<const uint8_t*>(header), headerLength) ==
        static_cast<size_t>(headerLength);
      if (sent) {
        sent = client.write(frame->buf, frame->len) == frame->len;
      }
      if (sent) {
        sent = client.write(reinterpret_cast<const uint8_t*>("\r\n"), 2) == 2;
      }

      esp_camera_fb_return(frame);
      if (!sent) break;

      vTaskDelay(pdMS_TO_TICKS(30));
    }

    client.stop();
  }
}

// ------------ SETUP ------------
void setup() {
  Serial.begin(115200);
  Serial.println("Starting ESP32-CAM");

  camera_config_t config = {};
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_QVGA;
  config.jpeg_quality = 12;
  config.fb_count = 2;
  config.grab_mode = CAMERA_GRAB_LATEST;
  config.fb_location = CAMERA_FB_IN_PSRAM;

  if (esp_camera_init(&config) != ESP_OK) {
    Serial.println("Camera initialization failed");
    while (true) delay(1000);
  }

  if (!SD_MMC.begin("/sdcard", true)) {
    Serial.println("SD card mount failed");
  } else {
    Serial.println("SD card ready");
  }

  WiFi.mode(WIFI_STA);
  if (!WiFi.config(localIP, gateway, subnet)) {
    Serial.println("Static IP configuration failed");
  }
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("Connecting to main ESP32");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("Camera IP: ");
  Serial.println(WiFi.localIP());

  server.on("/capture", HTTP_GET, handleCapture);
  server.begin();

  xTaskCreatePinnedToCore(
    streamTask,
    "CameraStream",
    8192,
    nullptr,
    1,
    nullptr,
    0
  );

  Serial.println("Camera ready");
  Serial.println("Stream: http://192.168.4.2:81/stream");
  Serial.println("Capture: http://192.168.4.2/capture");
}

// ------------ LOOP ------------
void loop() {
  server.handleClient();
  delay(2);
}