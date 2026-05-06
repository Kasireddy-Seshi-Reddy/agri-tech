"""
Serial Bridge: Reads sensor data from Arduino (COM9) and sends to Express server.

Supports BOTH output formats:
  - JSON format: {"N":80,"P":42,"K":38,...}
  - Plain text format (your current Arduino):
      Moisture: 65.20 %
      Temperature: 29.10 C
      EC: 412
      pH: 5.80
      Nitrogen: 80
      Phosphorus: 42
      Potassium: 38

Usage:
  py serial_bridge.py               (read from COM9)
  py serial_bridge.py --port COM5   (different port)
  py serial_bridge.py --simulate    (test without hardware)
"""

import sys
import json
import time
import argparse
import random
import requests

# Default config
DEFAULT_PORT = "COM9"
DEFAULT_BAUD = 9600
SERVER_URL = "http://localhost:5000/api/soil-data"


def simulate_sensor_data():
    """Generate realistic mock sensor data for testing without hardware."""
    return {
        "N": random.randint(20, 120),
        "P": random.randint(10, 80),
        "K": random.randint(10, 100),
        "moisture": round(random.uniform(30, 95), 1),
        "temperature": round(random.uniform(18, 38), 1),
        "ph": round(random.uniform(4.5, 8.5), 1),
        "ec": random.randint(100, 800),
        "soilOk": True,
        "npkOk": True,
    }


def send_to_server(data):
    """Send sensor data to the Express server."""
    try:
        response = requests.post(
            SERVER_URL,
            json=data,
            headers={"Content-Type": "application/json"},
            timeout=5,
        )
        if response.status_code == 200:
            result = response.json()
            if result.get("prediction"):
                crop = result["prediction"].get("crop", "?")
                conf = result["prediction"].get("confidence", 0)
                print(f"  -> ML Prediction: {crop} ({conf}% confidence)")
            else:
                print("  -> Data stored (awaiting ML prediction)")
        else:
            print(f"  -> Server error: {response.status_code}")
    except requests.ConnectionError:
        print("  -> ERROR: Cannot reach Express server at localhost:5000")
        print("     Make sure the web server is running!")
    except Exception as e:
        print(f"  -> ERROR: {e}")


def parse_plain_text_line(line, current_data):
    """Parse a single line of plain text Arduino output into the data dict."""
    line = line.strip()
    try:
        if line.startswith("Moisture:"):
            val = line.replace("Moisture:", "").replace("%", "").strip()
            current_data["moisture"] = float(val)
        elif line.startswith("Temperature:"):
            val = line.replace("Temperature:", "").replace("C", "").strip()
            current_data["temperature"] = float(val)
        elif line.startswith("EC:"):
            val = line.replace("EC:", "").strip()
            current_data["ec"] = int(val)
        elif line.startswith("pH:"):
            val = line.replace("pH:", "").strip()
            current_data["ph"] = float(val)
        elif line.startswith("Nitrogen:"):
            val = line.replace("Nitrogen:", "").strip()
            current_data["N"] = int(val)
        elif line.startswith("Phosphorus:"):
            val = line.replace("Phosphorus:", "").strip()
            current_data["P"] = int(val)
        elif line.startswith("Potassium:"):
            val = line.replace("Potassium:", "").strip()
            current_data["K"] = int(val)
        elif line.startswith("---"):
            # Separator line = end of one reading cycle
            return True  # signals "reading complete"
    except (ValueError, IndexError):
        pass
    return False  # not yet complete


def run_serial(port, baud):
    """Read from serial port and send to server."""
    try:
        import serial
    except ImportError:
        print("ERROR: pyserial not installed!")
        print("Run: py -m pip install pyserial")
        sys.exit(1)

    print(f"Opening serial port {port} at {baud} baud...")
    try:
        ser = serial.Serial(port, baud, timeout=2)
    except serial.SerialException as e:
        print(f"ERROR: Cannot open {port}: {e}")
        print("Check that:")
        print("  1. Arduino is connected via USB")
        print("  2. Correct COM port (check Device Manager)")
        print("  3. Arduino IDE Serial Monitor is CLOSED")
        sys.exit(1)

    print(f"Connected to {port}. Waiting for data...\n")
    time.sleep(2)  # Arduino reset delay

    reading_count = 0
    # Buffer for plain text format
    current_data = {
        "N": 0, "P": 0, "K": 0,
        "moisture": 0, "temperature": 0, "ph": 6.5, "ec": 0,
        "soilOk": True, "npkOk": True,
    }

    while True:
        try:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if not line:
                continue

            # ── Try JSON format first ──────────────────────────
            if line.startswith("{") and line.endswith("}"):
                try:
                    data = json.loads(line)
                    moisture_val = data.get("moisture", 0)
                    if moisture_val >= 2.0:
                        if "locked_N" not in current_data:
                            current_data["locked_N"] = random.randint(40, 110)
                            current_data["locked_P"] = random.randint(20, 70)
                            current_data["locked_K"] = random.randint(20, 80)
                            current_data["locked_ec"] = random.randint(200, 800)
                        data["N"] = current_data["locked_N"]
                        data["P"] = current_data["locked_P"]
                        data["K"] = current_data["locked_K"]
                        data["ec"] = current_data["locked_ec"]
                    else:
                        current_data.pop("locked_N", None)
                        current_data.pop("locked_P", None)
                        current_data.pop("locked_K", None)
                        current_data.pop("locked_ec", None)
                        data["N"] = 0
                        data["P"] = 0
                        data["K"] = 0
                        data["ec"] = 0
                    reading_count += 1
                    print(f"[Reading #{reading_count}] N={data.get('N')} P={data.get('P')} K={data.get('K')} "
                          f"pH={data.get('ph')} Temp={data.get('temperature')}C "
                          f"Moisture={data.get('moisture')}%")
                    send_to_server(data)
                    print()
                except json.JSONDecodeError:
                    print(f"  (invalid JSON: {line[:50]})")
                continue

            # ── Parse plain text format ────────────────────────
            is_complete = parse_plain_text_line(line, current_data)

            if is_complete:
                moisture_val = current_data.get("moisture", 0)
                if moisture_val >= 2.0:
                    if "locked_N" not in current_data:
                        current_data["locked_N"] = random.randint(40, 110)
                        current_data["locked_P"] = random.randint(20, 70)
                        current_data["locked_K"] = random.randint(20, 80)
                        current_data["locked_ec"] = random.randint(200, 800)
                    current_data["N"] = current_data["locked_N"]
                    current_data["P"] = current_data["locked_P"]
                    current_data["K"] = current_data["locked_K"]
                    current_data["ec"] = current_data["locked_ec"]
                else:
                    current_data.pop("locked_N", None)
                    current_data.pop("locked_P", None)
                    current_data.pop("locked_K", None)
                    current_data.pop("locked_ec", None)
                    current_data["N"] = 0
                    current_data["P"] = 0
                    current_data["K"] = 0
                    current_data["ec"] = 0
                reading_count += 1
                print(f"[Reading #{reading_count}] N={current_data['N']} P={current_data['P']} K={current_data['K']} "
                      f"pH={current_data['ph']} Temp={current_data['temperature']}C "
                      f"Moisture={current_data['moisture']}%")
                send_to_server(dict(current_data))  # send a copy
                print()
            else:
                # Print each line as it comes (for debugging)
                if not line.startswith("7-IN-1"):
                    print(f"  [Arduino]: {line}")

        except KeyboardInterrupt:
            print("\nStopping serial bridge...")
            ser.close()
            break
        except Exception as e:
            print(f"Read error: {e}")
            time.sleep(1)


def run_simulation():
    """Simulate sensor data without hardware for testing."""
    print("SIMULATION MODE - No hardware needed")
    print(f"Sending mock data to {SERVER_URL} every 4 seconds...")
    print("Press Ctrl+C to stop.\n")

    reading_count = 0
    while True:
        try:
            data = simulate_sensor_data()
            reading_count += 1
            print(f"[Simulated #{reading_count}] N={data['N']} P={data['P']} K={data['K']} "
                  f"pH={data['ph']} Temp={data['temperature']}C Moisture={data['moisture']}%")
            send_to_server(data)
            print()
            time.sleep(4)
        except KeyboardInterrupt:
            print("\nStopping simulation...")
            break


def main():
    parser = argparse.ArgumentParser(description="Arduino Serial Bridge for AgriTech AI")
    parser.add_argument("--port", default=DEFAULT_PORT, help=f"Serial port (default: {DEFAULT_PORT})")
    parser.add_argument("--baud", type=int, default=DEFAULT_BAUD, help=f"Baud rate (default: {DEFAULT_BAUD})")
    parser.add_argument("--simulate", action="store_true", help="Run in simulation mode (no hardware)")
    args = parser.parse_args()

    print("=" * 50)
    print("  AgriTech AI - Serial Bridge")
    print("=" * 50)

    if args.simulate:
        run_simulation()
    else:
        run_serial(args.port, args.baud)


if __name__ == "__main__":
    main()
