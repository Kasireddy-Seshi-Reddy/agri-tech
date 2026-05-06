import { useState, useEffect, useCallback } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sprout, Loader2, Info, Leaf, Droplets, FlaskConical, ThermometerSun,
  Activity, AlertTriangle, CheckCircle, XCircle, TrendingUp, Beaker, Wifi, WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types for the ML API response
interface CropInfo {
  season: string;
  water_need: string;
  growth_period: string;
  ideal_soil: string;
}

interface TopCrop {
  crop: string;
  confidence: number;
  season: string;
  water_need: string;
  growth_period: string;
  ideal_soil: string;
}

interface FertilizerRec {
  nutrient: string;
  status: string;
  fertilizer: string;
  reason: string;
  alternative: string;
}

interface PredictionResult {
  success: boolean;
  prediction: {
    crop: string;
    confidence: number;
    crop_info: CropInfo;
  };
  top_3_crops: TopCrop[];
  fertilizer_recommendations: FertilizerRec[];
  soil_health_index: number;
  input_parameters: {
    N: number; P: number; K: number;
    temperature: number; humidity: number; ph: number;
  };
  error?: string;
  fallback?: boolean;
}

// Mock data generator (fallback)
const generateSensorData = () => ({
  nitrogen: Math.floor(Math.random() * (100 - 60) + 60),
  phosphorus: Math.floor(Math.random() * (60 - 30) + 30),
  potassium: Math.floor(Math.random() * (50 - 20) + 20),
  moisture: Math.floor(Math.random() * (80 - 40) + 40),
  ph: parseFloat((Math.random() * (8.5 - 5.5) + 5.5).toFixed(1)),
  temperature: Math.floor(Math.random() * (35 - 20) + 20),
});

function getStatusColor(status: string) {
  switch (status) {
    case "Low": return "text-red-500 bg-red-500/10 border-red-500/20";
    case "Moderate": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    case "Sufficient": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    default: return "text-muted-foreground bg-muted";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Low": return XCircle;
    case "Moderate": return AlertTriangle;
    case "Sufficient": return CheckCircle;
    default: return Info;
  }
}

function getHealthLabel(index: number) {
  if (index >= 80) return { label: "Excellent", color: "text-emerald-500" };
  if (index >= 60) return { label: "Good", color: "text-green-500" };
  if (index >= 40) return { label: "Moderate", color: "text-yellow-500" };
  if (index >= 20) return { label: "Poor", color: "text-orange-500" };
  return { label: "Critical", color: "text-red-500" };
}

export default function Predict() {
  const [isPredicting, setIsPredicting] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sensorData, setSensorData] = useState(generateSensorData());
  const [isLiveData, setIsLiveData] = useState(false);

  // Poll for live sensor data from Arduino
  const fetchLiveData = useCallback(async () => {
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
          ph: sensor.ph,
          temperature: sensor.temperature,
        });
        setIsLiveData(true);

        // Auto-apply latest ML prediction if available and no manual prediction yet
        if (data.prediction && !result) {
          setResult(data.prediction);
        }
      } else {
        // No hardware — show zeros
        setSensorData({
          nitrogen: 0, phosphorus: 0, potassium: 0,
          moisture: 0, ph: 0, temperature: 0,
        });
        setIsLiveData(false);
      }
    } catch {
      setSensorData({
        nitrogen: 0, phosphorus: 0, potassium: 0,
        moisture: 0, ph: 0, temperature: 0,
      });
      setIsLiveData(false);
    }
  }, [result]);

  // Poll live data every 5 seconds
  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 5000);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  const handlePredict = async () => {
    setIsPredicting(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          N: sensorData.nitrogen,
          P: sensorData.phosphorus,
          K: sensorData.potassium,
          temperature: sensorData.temperature,
          humidity: sensorData.moisture,
          ph: sensorData.ph,
        }),
      });

      const data: PredictionResult = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Prediction failed. Please try again.");
      }
    } catch (err: any) {
      setError("Cannot reach the ML server. Make sure the Flask API is running on port 5001.");
    } finally {
      setIsPredicting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  const params = [
    { label: "Nitrogen (N)", value: sensorData.nitrogen, unit: "mg/kg", icon: FlaskConical, color: "text-blue-500" },
    { label: "Phosphorus (P)", value: sensorData.phosphorus, unit: "mg/kg", icon: FlaskConical, color: "text-purple-500" },
    { label: "Potassium (K)", value: sensorData.potassium, unit: "mg/kg", icon: FlaskConical, color: "text-indigo-500" },
    { label: "Moisture", value: sensorData.moisture, unit: "%", icon: Droplets, color: "text-cyan-500" },
    { label: "pH Level", value: sensorData.ph, unit: "", icon: Activity, color: "text-emerald-500" },
    { label: "Temperature", value: sensorData.temperature, unit: "°C", icon: ThermometerSun, color: "text-orange-500" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Crop & Fertilizer Prediction</h1>
          <p className="text-muted-foreground mt-1">
            {isLiveData
              ? "Live sensor data from Arduino — ML model auto-predicts on each reading."
              : "ML-powered crop recommendation and fertilizer analysis."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLiveData && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 animate-pulse">
              <Wifi className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
          )}
          {result && (
            <Button variant="outline" onClick={handleReset}>
              New Prediction
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left Column: Sensor Data + Predict Button ──────────── */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-muted shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Beaker className="h-5 w-5 text-primary" />
                {isLiveData ? "Live Sensor Data" : "Current Parameters"}
              </CardTitle>
              <CardDescription>
                {isLiveData ? "Real-time from Arduino (COM9)" : "Simulated — connect hardware for live data"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {params.map((param) => (
                  <div key={param.label} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <param.icon className={cn("h-4 w-4", param.color)} />
                      <span className="text-sm text-muted-foreground">{param.label}</span>
                    </div>
                    <span className="font-semibold text-sm">
                      {param.value}{param.unit && <span className="text-muted-foreground font-normal ml-1">{param.unit}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handlePredict}
                disabled={isPredicting}
              >
                {isPredicting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Soil Data...
                  </>
                ) : (
                  <>
                    <Sprout className="mr-2 h-4 w-4" />
                    {isLiveData ? "Run ML Prediction (Live)" : "Run ML Prediction"}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Random Forest Model &bull; 24 Crops &bull; 100% Accuracy
              </p>
            </CardFooter>
          </Card>
        </div>

        {/* ── Right Column: Results ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loading State */}
          {isPredicting && (
            <Card className="border-muted shadow-sm flex flex-col items-center justify-center p-12 min-h-[400px]">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h3 className="text-xl font-medium mb-2">Processing with ML Model...</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Sending {isLiveData ? "live" : "simulated"} soil parameters to the Random Forest classifier.
              </p>
            </Card>
          )}

          {/* Empty State */}
          {!isPredicting && !result && !error && (
            <Card className="border-muted shadow-sm flex flex-col items-center justify-center p-12 min-h-[400px] bg-muted/30 border-dashed">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                <Sprout className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground mb-1">
                {isLiveData ? "Live Data Ready" : "No Prediction Run Yet"}
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {isLiveData
                  ? "Sensor data is streaming from Arduino. Click 'Run ML Prediction' to analyze or wait for auto-prediction."
                  : "Click 'Run ML Prediction' to analyze current soil data using the Random Forest model."}
              </p>
            </Card>
          )}

          {/* Error State */}
          {error && !isPredicting && (
            <Card className="border-destructive/20 shadow-sm p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg font-medium">Prediction Failed</h3>
                <p className="text-sm text-muted-foreground max-w-md">{error}</p>
                <div className="bg-muted/50 rounded-lg p-4 text-sm text-left w-full max-w-md space-y-2">
                  <p className="font-medium">To fix this:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Open a terminal in the <code className="bg-muted px-1 rounded">ml-model</code> folder</li>
                    <li>Run: <code className="bg-muted px-1 rounded">py app.py</code></li>
                    <li>Wait for "Running on port 5001" message</li>
                    <li>Try predicting again</li>
                  </ol>
                </div>
                <Button variant="outline" onClick={handlePredict}>
                  Retry Prediction
                </Button>
              </div>
            </Card>
          )}

          {/* ── Prediction Results ──────────────────────────────── */}
          {result && !isPredicting && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">

              {/* Primary Crop Card */}
              <Card className="border-emerald-500/20 shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/5 p-6 border-b border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      ML Prediction
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground">
                      Random Forest Classifier
                    </Badge>
                    {isLiveData && (
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-700 border-blue-500/30">
                        <Wifi className="h-3 w-3 mr-1" />
                        From Live Sensor
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-3xl font-bold">
                      <span className="text-emerald-600 capitalize">{result.prediction.crop}</span>
                    </h2>
                    <span className="text-lg font-semibold text-emerald-500">
                      {result.prediction.confidence}% confidence
                    </span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Season</p>
                      <p className="text-sm font-medium">{result.prediction.crop_info.season}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Water Need</p>
                      <p className="text-sm font-medium">{result.prediction.crop_info.water_need}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Growth Period</p>
                      <p className="text-sm font-medium">{result.prediction.crop_info.growth_period}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Ideal Soil</p>
                      <p className="text-sm font-medium">{result.prediction.crop_info.ideal_soil}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top 3 Alternatives + Soil Health */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Top 3 Crops */}
                <Card className="border-muted shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-primary" />
                      Top 3 Recommended Crops
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {result.top_3_crops.map((crop, index) => (
                      <div key={crop.crop} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                              index === 0 ? "bg-emerald-500 text-white" :
                              index === 1 ? "bg-blue-500 text-white" :
                              "bg-purple-500 text-white"
                            )}>
                              {index + 1}
                            </span>
                            <span className="font-medium capitalize">{crop.crop}</span>
                          </div>
                          <span className="text-sm font-semibold">{crop.confidence}%</span>
                        </div>
                        <Progress value={crop.confidence} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {crop.season} &bull; {crop.water_need} water &bull; {crop.growth_period}
                        </p>
                        {index < result.top_3_crops.length - 1 && <Separator />}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Soil Health Index */}
                <Card className="border-muted shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Soil Health Index
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative h-32 w-32">
                      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" className="stroke-muted" />
                        <circle
                          cx="60" cy="60" r="54" fill="none" strokeWidth="8"
                          strokeDasharray={`${(result.soil_health_index / 100) * 339.3} 339.3`}
                          strokeLinecap="round"
                          className={cn(
                            result.soil_health_index >= 60 ? "stroke-emerald-500" :
                            result.soil_health_index >= 40 ? "stroke-yellow-500" :
                            "stroke-red-500"
                          )}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold">{result.soil_health_index}</span>
                        <span className="text-xs text-muted-foreground">/ 100</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className={cn("text-lg font-semibold", getHealthLabel(result.soil_health_index).color)}>
                        {getHealthLabel(result.soil_health_index).label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on normalized N, P, K values
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fertilizer Recommendations */}
              <Card className="border-muted shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-primary" />
                    Fertilizer Recommendations
                  </CardTitle>
                  <CardDescription>
                    Based on current NPK levels for {result.prediction.crop} cultivation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {result.fertilizer_recommendations.map((rec) => {
                      const StatusIcon = getStatusIcon(rec.status);
                      return (
                        <div
                          key={rec.nutrient}
                          className={cn(
                            "p-4 rounded-lg border",
                            getStatusColor(rec.status)
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <StatusIcon className="h-5 w-5 mt-0.5 shrink-0" />
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold">{rec.nutrient}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {rec.status}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium">
                                Recommended: {rec.fertilizer}
                              </p>
                              <p className="text-sm opacity-80">
                                {rec.reason}
                              </p>
                              <p className="text-xs opacity-60">
                                <span className="font-medium">Alternative:</span> {rec.alternative}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
