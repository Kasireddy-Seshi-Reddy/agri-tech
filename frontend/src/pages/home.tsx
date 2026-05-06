import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Leaf, Cpu, LineChart, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <header className="container mx-auto px-4 h-20 flex items-center justify-between border-b border-transparent">
        <div className="flex items-center gap-2 text-primary">
          <Leaf className="h-6 w-6" />
          <span className="font-bold text-xl tracking-tight">AgriTech</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/auth">
            <Button variant="ghost" className="font-medium text-muted-foreground hover:text-foreground">Log in</Button>
          </Link>
          <Link href="/auth">
            <Button className="font-medium rounded-full px-6 shadow-sm hover:shadow-md transition-all">Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            OpenRouter Llama-3
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
            Cultivating the Future with<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
              Data-Driven Insights.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 leading-relaxed">
            Get real-time, actionable crop recommendations based on your soil data.
            Make data-driven decisions to maximize yield and optimize resources.
          </p>
        </section>

        {/* Features Grid */}
        <section className="bg-card/50 py-24 border-t">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <Cpu className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">IoT Integration</h3>
                <p className="text-muted-foreground">Seamless connection with agricultural sensors streaming crucial soil parameters.</p>
              </div>
              <div className="p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <LineChart className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Smart Analytics</h3>
                <p className="text-muted-foreground">Advanced predictive modeling using OpenRouter AI to determine the optimal crop for your soil.</p>
              </div>
              <div className="p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">AI Assistant</h3>
                <p className="text-muted-foreground">Context-aware farming chat assistant specialized in agriculture, irrigation, and pest control.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
