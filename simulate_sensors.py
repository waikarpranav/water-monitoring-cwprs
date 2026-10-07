import json
import random
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

BACKEND_URL = "http://localhost:8000/readings/"
DEVICE_ID = "ESP32-001"

def send_reading(ph, turbidity, temp, h2s, dt=None):
    payload = {
        "device_id": DEVICE_ID,
        "ph": round(ph, 2),
        "turbidity_ntu": round(turbidity, 2),
        "temperature_c": round(temp, 1),
        "h2s_ppm": round(h2s, 4),
    }
    if dt:
        payload["timestamp"] = dt.isoformat()

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        BACKEND_URL,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.status in (200, 201)
    except Exception as e:
        print(f"Failed to post reading: {e}")
        return False

def seed_history(count=30):
    print(f"Seeding {count} initial historical readings...")
    now = datetime.now(timezone.utc)
    ph = 7.35
    turbidity = 2.1
    temp = 24.5
    h2s = 0.012

    for i in range(count, 0, -1):
        dt = now - timedelta(seconds=i * 10)
        # Random walk
        ph = max(6.6, min(8.2, ph + random.uniform(-0.08, 0.08)))
        turbidity = max(0.5, min(3.8, turbidity + random.uniform(-0.25, 0.25)))
        temp = max(22.0, min(27.0, temp + random.uniform(-0.2, 0.2)))
        h2s = max(0.002, min(0.045, h2s + random.uniform(-0.003, 0.003)))
        send_reading(ph, turbidity, temp, h2s, dt)
        time.sleep(0.05)
    print("History seeded successfully!")

def run_simulation(interval=3.0):
    print(f"Starting live sensor simulator for {DEVICE_ID} (interval={interval}s)...")
    ph = 7.30
    turbidity = 2.0
    temp = 24.6
    h2s = 0.015

    step = 0
    while True:
        step += 1
        # Smooth random walk
        ph = max(6.55, min(8.35, ph + random.uniform(-0.05, 0.05)))
        turbidity = max(0.8, min(4.2, turbidity + random.uniform(-0.15, 0.15)))
        temp = max(23.0, min(26.5, temp + random.uniform(-0.1, 0.1)))
        h2s = max(0.005, min(0.048, h2s + random.uniform(-0.002, 0.002)))

        # Once in every 40 steps, simulate a short water disturbance
        if step % 40 == 0:
            print("[SIMULATOR] Simulating transient turbidity & pH fluctuation...")
            turbidity_sample = turbidity + 1.2
            ph_sample = ph - 0.4
        else:
            turbidity_sample = turbidity
            ph_sample = ph

        success = send_reading(ph_sample, turbidity_sample, temp, h2s)
        if success:
            print(f"[OK] pH={ph_sample:.2f} | Turbidity={turbidity_sample:.2f} NTU | Temp={temp:.1f}°C | H2S={h2s:.4f} ppm")
        time.sleep(interval)

if __name__ == "__main__":
    try:
        seed_history(30)
        run_simulation(3.0)
    except KeyboardInterrupt:
        print("\nSimulator stopped.")
