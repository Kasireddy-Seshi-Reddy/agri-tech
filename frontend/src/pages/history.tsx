import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, RefreshCw, Inbox, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryEntry {
  id: number;
  timestamp: string;
  sensorData: { N: number; P: number; K: number; moisture: number; temperature: number; ph: number; ec: number };
  prediction: { crop: string; confidence: number };
  soilHealthIndex: number;
}

export default function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/history");
      const data = await response.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch {
      // Server not reachable
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: number) => {
    await fetch(`/api/history/${id}`, { method: "DELETE" });
    setHistory((prev) => prev.filter((e) => e.id !== id));
  };

  const clearAll = async () => {
    await fetch("/api/history", { method: "DELETE" });
    setHistory([]);
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prediction History</h1>
          <p className="text-muted-foreground mt-1">
            Log of all manual ML predictions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{history.length} records</Badge>
          <Button variant="outline" size="sm" onClick={fetchHistory}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {history.length > 0 && (
            <Button variant="destructive" size="sm" onClick={clearAll}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <Card className="border-muted shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-primary" />
            Historical Records
          </CardTitle>
          <CardDescription>
            {history.length > 0
              ? "Showing predictions from manual 'Run ML Prediction' clicks (newest first)"
              : "No predictions yet — go to Predict Crop and click 'Run ML Prediction'"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground mb-1">No History Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                History saves only when you manually click "Run ML Prediction" on the Predict Crop page.
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date & Time</TableHead>
                    <TableHead className="text-right">N</TableHead>
                    <TableHead className="text-right">P</TableHead>
                    <TableHead className="text-right">K</TableHead>
                    <TableHead className="text-right">Moisture</TableHead>
                    <TableHead className="text-right">pH</TableHead>
                    <TableHead className="text-right">Temp</TableHead>
                    <TableHead className="text-right">Health</TableHead>
                    <TableHead>Predicted Crop</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((row) => (
                    <TableRow key={row.id} className="group">
                      <TableCell className="font-medium whitespace-nowrap text-sm">
                        {formatDate(row.timestamp)}
                      </TableCell>
                      <TableCell className="text-right">{row.sensorData.N}</TableCell>
                      <TableCell className="text-right">{row.sensorData.P}</TableCell>
                      <TableCell className="text-right">{row.sensorData.K}</TableCell>
                      <TableCell className="text-right">{row.sensorData.moisture}%</TableCell>
                      <TableCell className="text-right">{row.sensorData.ph}</TableCell>
                      <TableCell className="text-right">{row.sensorData.temperature}°C</TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "font-semibold",
                          row.soilHealthIndex >= 60 ? "text-emerald-600" :
                          row.soilHealthIndex >= 40 ? "text-yellow-600" :
                          "text-red-600"
                        )}>
                          {row.soilHealthIndex}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-semibold capitalize">
                            {row.prediction.crop}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {row.prediction.confidence}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteEntry(row.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
