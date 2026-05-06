import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Droplets, ThermometerSun, Zap, Activity, Sprout, FlaskConical, Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data generator (fallback when no hardware)
const generateMockData = () => ({
  nitrogen: Math.floor(Math.random() * (100 - 60) + 60),
  phosphorus: Math.floor(Math.random() * (60 - 30) + 30),
  potassium: Math.floor(Math.random() * (50 - 20) + 20),
  moisture: Math.floor(Math.random() * (80 - 40) + 40),
  conductivity: (Math.random() * (2.0 - 0.5) + 0.5).toFixed(1),
  ph: (Math.random() * (8.5 - 5.5) + 5.5).toFixed(1),
  temperature: Math.floor(Math.random() * (35 - 20) + 20),
  lastUpdated: new Date().toLocaleTimeString(),
});

type SensorData = {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
  conductivity: string;
  ph: string;
  temperature: number;
  lastUpdated: string;
};

export default function Dashboard() {
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData>(generateMockData());
  const [isLiveData, setIsLiveData] = useState(false);
  const [latestPrediction, setLatestPrediction] = useState<any>(null);

  // Poll the server for real sensor data
  const fetchSensorData = useCallback(async () => {
    try {
      const response = await fetch("/api/soil-data");
      const data = await response.json();

      if (data.success && data.hasData) {
        const sensor = data.sensorData;
        setSensorData({
          nitrogen: sensor.nitrogen,
          phosphorus: sensor.phosphorus,
          potassium: sensor.potassium,
          moisture: sensor.moisture,
          conductivity: String(sensor.ec || "0"),
          ph: String(sensor.ph),
          temperature: sensor.temperature,
          lastUpdated: data.lastUpdated
            ? new Date(data.lastUpdated).toLocaleTimeString()
            : new Date().toLocaleTimeString(),
        });
        setDeviceConnected(true);
        setIsLiveData(true);

        if (data.prediction?.prediction) {
          setLatestPrediction(data.prediction.prediction);
        }
      } else {
        // No hardware connected — show zeros
        setSensorData({
          nitrogen: 0, phosphorus: 0, potassium: 0, moisture: 0,
          conductivity: "0", ph: "0", temperature: 0,
          lastUpdated: new Date().toLocaleTimeString(),
        });
        setDeviceConnected(false);
        setIsLiveData(false);
        setLatestPrediction(null);
      }
    } catch {
      // Server not reachable — show zeros
      setSensorData({
        nitrogen: 0, phosphorus: 0, potassium: 0, moisture: 0,
        conductivity: "0", ph: "0", temperature: 0,
        lastUpdated: new Date().toLocaleTimeString(),
      });
      setDeviceConnected(false);
      setIsLiveData(false);
    }
  }, []);

  // Poll every 3 seconds
  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 3000);
    return () => clearInterval(interval);
  }, [fetchSensorData]);

  const metrics = [
    { label: "Nitrogen (N)", value: sensorData.nitrogen, unit: "mg/kg", icon: FlaskConical, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Phosphorus (P)", value: sensorData.phosphorus, unit: "mg/kg", icon: FlaskConical, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Potassium (K)", value: sensorData.potassium, unit: "mg/kg", icon: FlaskConical, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Moisture", value: sensorData.moisture, unit: "%", icon: Droplets, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { label: "pH Level", value: sensorData.ph, unit: "", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Temperature", value: sensorData.temperature, unit: "°C", icon: ThermometerSun, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Conductivity", value: sensorData.conductivity, unit: "EC", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {isLiveData
              ? "Live soil metrics from your Arduino sensor."
              : "Simulated soil metrics. Connect your Arduino for live data."}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border",
            deviceConnected 
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
              : "bg-destructive/10 text-destructive border-destructive/20"
          )}>
            {deviceConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {deviceConnected ? "Hardware Connected" : "No Hardware — Mock Data"}
          </div>
          {isLiveData && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 animate-pulse">
              LIVE
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-muted shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tight">{metric.value}</span>
                    <span className="text-sm font-medium text-muted-foreground">{metric.unit}</span>
                  </div>
                </div>
                <div className={cn("p-2 rounded-lg", metric.bg, metric.color)}>
                  <metric.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              {latestPrediction ? (
                <>
                  <p className="font-semibold text-lg capitalize text-emerald-600">
                    {latestPrediction.crop}
                  </p>
                  <p className="text-xs text-muted-foreground mb-1">
                    {latestPrediction.confidence}% confidence
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Auto-predicted from live data
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-sm text-muted-foreground mb-1">Ready for Analysis</p>
                  <p className="text-xs text-muted-foreground mb-4">Updated: {sensorData.lastUpdated}</p>
                </>
              )}
              <Link href="/predict">
                <Button className="w-full">
                  {latestPrediction ? "View Full Analysis" : "Predict Crop"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
