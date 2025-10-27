// ----------------------------------
// MQ-7 SENSOR CALIBRATION SKETCH
// ----------------------------------
// Instructions:
// 1. Place sensor in CLEAN, WELL-VENTILATED area (open window/outdoor)
// 2. Let sensor warm up for 2-3 minutes before starting
// 3. Upload this sketch
// 4. Wait for calibration to complete (5 minutes)
// 5. Note the final R0 value shown in Serial Monitor
// 6. Use that R0 value in your main project code

#define MQ7_PIN A0

// Calibration settings
const int WARMUP_TIME = 180;      // 3 minutes warmup (180 seconds)
const int SAMPLE_TIME = 300;      // 5 minutes sampling (300 seconds)
const int SAMPLE_INTERVAL = 3000; // Take sample every 3 seconds
const int TOTAL_SAMPLES = SAMPLE_TIME / (SAMPLE_INTERVAL / 1000);

// Variables
float sumRS = 0;
int sampleCount = 0;
bool warmupComplete = false;

void setup() {
  Serial.begin(115200);
  Serial.println("\n========================================");
  Serial.println("    MQ-7 CALIBRATION PROGRAM");
  Serial.println("========================================");
  Serial.println();
  Serial.println("IMPORTANT: Place sensor in CLEAN AIR!");
  Serial.println("(Open windows or go outdoors)");
  Serial.println();
  
  pinMode(MQ7_PIN, INPUT);
  
  // Warmup phase
  Serial.println("Phase 1: Warming up sensor...");
  Serial.println("Please wait 3 minutes for sensor to stabilize");
  Serial.println();
  
  for(int i = WARMUP_TIME; i > 0; i--) {
    Serial.print("Warmup: ");
    Serial.print(i);
    Serial.println(" seconds remaining...");
    delay(1000);
  }
  
  Serial.println();
  Serial.println("✓ Warmup complete!");
  Serial.println();
  Serial.println("Phase 2: Collecting calibration samples...");
  Serial.print("Total samples to collect: ");
  Serial.println(TOTAL_SAMPLES);
  Serial.println();
  warmupComplete = true;
}

void loop() {
  if (!warmupComplete) return;
  
  if (sampleCount < TOTAL_SAMPLES) {
    // Read sensor
    int rawValue = analogRead(MQ7_PIN);
    float voltage = (float)rawValue / 1023.0 * 5.0;
    float RS = (5.0 - voltage) / voltage;
    
    // Accumulate
    sumRS += RS;
    sampleCount++;
    
    // Progress display
    Serial.print("Sample ");
    Serial.print(sampleCount);
    Serial.print("/");
    Serial.print(TOTAL_SAMPLES);
    Serial.print(" | Raw: ");
    Serial.print(rawValue);
    Serial.print(" | Voltage: ");
    Serial.print(voltage, 3);
    Serial.print("V | RS: ");
    Serial.println(RS, 3);
    
    // Progress bar
    int progress = (sampleCount * 100) / TOTAL_SAMPLES;
    Serial.print("[");
    for(int i = 0; i < 50; i++) {
      if (i < progress / 2) Serial.print("=");
      else Serial.print(" ");
    }
    Serial.print("] ");
    Serial.print(progress);
    Serial.println("%");
    Serial.println();
    
    delay(SAMPLE_INTERVAL);
    
  } else if (sampleCount == TOTAL_SAMPLES) {
    // Calibration complete - calculate R0
    float avgRS = sumRS / TOTAL_SAMPLES;
    
    // From MQ-7 datasheet: RS/R0 ratio in clean air is approximately 27.5
    float R0 = avgRS / 27.5;
    
    Serial.println();
    Serial.println("========================================");
    Serial.println("    CALIBRATION COMPLETE!");
    Serial.println("========================================");
    Serial.println();
    Serial.print("Average RS (clean air): ");
    Serial.println(avgRS, 4);
    Serial.println();
    Serial.println(">>> YOUR CALIBRATED R0 VALUE <<<");
    Serial.print(">>> R0 = ");
    Serial.print(R0, 4);
    Serial.println(" <<<");
    Serial.println();
    Serial.println("========================================");
    Serial.println("NEXT STEPS:");
    Serial.println("1. Copy the R0 value above");
    Serial.println("2. Update your main code:");
    Serial.println("   const float R0_CALIBRATED = " + String(R0, 4) + ";");
    Serial.println("3. Use it in your getPPM() function");
    Serial.println("========================================");
    
    sampleCount++; // Increment to prevent repeated printing
    
    // Keep blinking to show completion
    while(true) {
      Serial.println("Calibration done. You can close this now.");
      delay(5000);
    }
  }
}