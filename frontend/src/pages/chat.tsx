import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
};

export default function Chat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: historyData, isLoading: isHistoryLoading } = useQuery<Message[]>({
    queryKey: ["/api/chat/history"],
    queryFn: async () => {
      const res = await fetch("/api/chat/history");
      if (!res.ok) return [];
      return await res.json();
    }
  });

  useEffect(() => {
    if (historyData) {
      if (historyData.length === 0) {
        setMessages([{
          id: "1",
          role: "assistant",
          content: "Hello! I am your agricultural AI assistant. I can help answer questions about crops, irrigation, fertilizers, pest control, and farming practices. How can I assist you today?"
        }]);
      } else {
        setMessages(historyData);
      }
    }
  }, [historyData]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isHistoryLoading) return;

    const userMessageContent = input.trim();
    const newUserMessage: Message = { id: Date.now().toString(), role: "user", content: userMessageContent };
    
    setInput("");
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessageContent }),
      });

      if (!response.ok) {
        throw new Error("I'm sorry, I'm having trouble connecting to my brain right now.");
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: "assistant", 
        content: data.content 
      }]);
      
      queryClient.invalidateQueries({ queryKey: ["/api/chat/history"] });
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: "assistant", 
        content: error.message || "An unexpected error occurred. Please try again.",
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  const suggestions = [
    "Where is the dashboard?",
    "Explain the soil health index",
    "How do I predict a crop?",
    "Where is my history?",
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">AI Expert Assistant</h1>
        <p className="text-muted-foreground mt-1">Navigate the platform, explain charts, and get farming advice.</p>
      </div>

      <Card className="flex-1 flex flex-col border-muted shadow-lg overflow-hidden bg-card/50 backdrop-blur-sm">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-6 pb-4">
            {messages.length === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    className="text-left justify-start h-auto py-3 px-4 text-xs font-normal border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all"
                    onClick={() => {
                      setInput(suggestion);
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 max-w-[90%]",
                  message.role === "user" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className="shrink-0">
                  <Avatar className={cn("h-9 w-9 border shadow-sm", message.role === "assistant" ? "bg-primary/10" : "bg-muted")}>
                    {message.role === "assistant" ? (
                      <div className="h-full w-full flex items-center justify-center text-primary">
                        <Bot className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </Avatar>
                </div>
                
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm shadow-sm whitespace-pre-wrap leading-relaxed",
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : message.isError
                        ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-none"
                        : "bg-background text-foreground border border-muted-foreground/10 rounded-tl-none"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 max-w-[85%]">
                <Avatar className="h-9 w-9 bg-primary/10 border text-primary flex items-center justify-center shadow-sm">
                  <Bot className="h-5 w-5" />
                </Avatar>
                <div className="rounded-2xl px-4 py-3 text-sm bg-background border flex items-center gap-1 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <CardFooter className="p-4 bg-background/80 backdrop-blur border-t gap-3 pt-4">
          <div className="relative flex-1">
            <textarea
              placeholder="Ask me anything about the site or farming..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isHistoryLoading}
              rows={1}
              className="w-full min-h-[50px] max-h-[200px] rounded-xl border border-input bg-background px-4 py-3 pr-12 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all scrollbar-none"
            />
            <Button 
              type="submit" 
              size="icon" 
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isHistoryLoading}
              className="absolute right-2 bottom-2 h-8 w-8 rounded-lg shadow-md transition-all hover:scale-105"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
