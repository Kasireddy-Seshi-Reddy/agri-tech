// ===================================================
// MODIFIED ARDUINO SKETCH — JSON OUTPUT FOR SERIAL BRIDGE
// ===================================================
// Upload this to your Arduino via Arduino IDE.
// This replaces your current sketch.
// 
// Changes from original:
//   - Outputs data as a single JSON line per reading cycle
//   - Easy to parse by the Python serial bridge
// ===================================================

#include <SoftwareSerial.h>

#define RE 8
#define DE 7

SoftwareSerial mod(2, 3);   // RX, TX

// Soil Query (Start address 0x0000, 4 registers: moisture, temp, EC, pH)
const byte soilQuery[] = {0x01,0x03,0x00,0x00,0x00,0x04,0x44,0x09};

// NPK Query (Start address 0x001E, 3 registers: N, P, K)
const byte npkQuery[]  = {0x01,0x03,0x00,0x1E,0x00,0x03,0x65,0xCD};

byte values[20];

// Store readings
float moisture = 0, temperature = 0, ph = 0;
int ec = 0, nitrogen = 0, phosphorus = 0, potassium = 0;
bool soilOk = false, npkOk = false;

void setup() {
  Serial.begin(9600);
  mod.begin(4800);

  pinMode(RE, OUTPUT);
  pinMode(DE, OUTPUT);

  digitalWrite(RE, LOW);
  digitalWrite(DE, LOW);
}

void loop() {
  soilOk = readSoil();
  delay(500);
  npkOk = readNPK();

  // Output as JSON (single line)
  Serial.print("{");
  Serial.print("\"N\":");       Serial.print(nitrogen);
  Serial.print(",\"P\":");      Serial.print(phosphorus);
  Serial.print(",\"K\":");      Serial.print(potassium);
  Serial.print(",\"moisture\":");    Serial.print(moisture, 1);
  Serial.print(",\"temperature\":"); Serial.print(temperature, 1);
  Serial.print(",\"ph\":");     Serial.print(ph, 1);
  Serial.print(",\"ec\":");     Serial.print(ec);
  Serial.print(",\"soilOk\":"); Serial.print(soilOk ? "true" : "false");
  Serial.print(",\"npkOk\":");  Serial.print(npkOk ? "true" : "false");
  Serial.println("}");

  delay(3000);  // Read every ~4 seconds
}

// =========================

bool readSoil() {
  digitalWrite(DE, HIGH);
  digitalWrite(RE, HIGH);
  delay(10);

  mod.write(soilQuery, sizeof(soilQuery));
  mod.flush();

  digitalWrite(DE, LOW);
  digitalWrite(RE, LOW);

  delay(300);

  if (mod.available() >= 13) {
    for (int i = 0; i < 13; i++) {
      values[i] = mod.read();
    }

    uint16_t rawMoisture = (values[3] << 8) | values[4];
    uint16_t rawTemp     = (values[5] << 8) | values[6];
    uint16_t rawEc       = (values[7] << 8) | values[8];
    uint16_t rawPh       = (values[9] << 8) | values[10];

    moisture    = rawMoisture / 10.0;
    temperature = rawTemp / 10.0;
    ec          = rawEc;
    ph          = rawPh / 10.0;
    return true;
  }
  return false;
}

// =========================

bool readNPK() {
  digitalWrite(DE, HIGH);
  digitalWrite(RE, HIGH);
  delay(10);

  mod.write(npkQuery, sizeof(npkQuery));
  mod.flush();

  digitalWrite(DE, LOW);
  digitalWrite(RE, LOW);

  delay(300);

  if (mod.available() >= 11) {
    for (int i = 0; i < 11; i++) {
      values[i] = mod.read();
    }

    nitrogen   = (values[3] << 8) | values[4];
    phosphorus = (values[5] << 8) | values[6];
    potassium  = (values[7] << 8) | values[8];
    return true;
  }
  return false;
}
