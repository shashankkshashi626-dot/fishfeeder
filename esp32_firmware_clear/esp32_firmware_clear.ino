#include <Preferences.h>

Preferences prefs;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== Clearing FishFeeder Credentials ===");
  
  prefs.begin("feedme_creds", false);
  prefs.clear();
  prefs.end();
  
  Serial.println("[OK] All stored credentials cleared from flash!");
  Serial.println("[OK] Re-upload the main firmware now.");
}

void loop() {
  delay(1000);
}
