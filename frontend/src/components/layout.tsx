import { Link, useLocation } from "wouter";
import { Leaf, LayoutDashboard, History, MessageSquare, Sprout, LogOut, Menu, Shield, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/predict", label: "Predict Crop", icon: Sprout },
    { href: "/history", label: "History", icon: History },
    { href: "/chat", label: "AI Assistant", icon: MessageSquare },
    { href: "/support", label: "Help & Support", icon: HelpCircle },
  ];

  if (user?.username === "capteam@gmail.com") {
    navItems.push({ href: "/admin", label: "Admin Portal", icon: Shield });
  }

  const Sidebar = () => (
    <div className="flex h-full flex-col bg-sidebar border-r">
      <div className="p-6 flex items-center gap-2 text-sidebar-primary">
        <Leaf className="h-6 w-6" />
        <span className="font-bold text-xl tracking-tight">AgriTech AI</span>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
                location === item.href
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4" />
          {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 fixed inset-y-0 z-50">
        <Sidebar />
      </div>

      {/* Mobile Nav & Content */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:hidden sticky top-0 z-40">
          <div className="flex items-center gap-2 text-primary">
            <Leaf className="h-5 w-5" />
            <span className="font-bold text-lg">AgriTech</span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
