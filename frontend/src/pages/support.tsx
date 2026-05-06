import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Send, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Support() {
  const [question, setQuestion] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: queries, isLoading } = useQuery({
    queryKey: ["/api/queries"],
  });

  const submitMutation = useMutation({
    mutationFn: async (q: string) => {
      const res = await apiRequest("POST", "/api/queries", { question: q });
      if (!res.ok) throw new Error("Failed to submit query");
    },
    onSuccess: () => {
      setQuestion("");
      queryClient.invalidateQueries({ queryKey: ["/api/queries"] });
      toast({
        title: "Query Submitted",
        description: "Your question has been sent to our support team.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    submitMutation.mutate(question);
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString("en-IN", {
        month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-primary" />
          Help & Support
        </h1>
        <p className="text-muted-foreground mt-1">
          Have a question? Ask our support team directly!
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit a Query</CardTitle>
          <CardDescription>
            Type your question below and our team will get back to you.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <Textarea 
              placeholder="How can we help you today?" 
              className="min-h-[120px]"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={submitMutation.isPending}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={!question.trim() || submitMutation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {submitMutation.isPending ? "Submitting..." : "Send Query"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <h2 className="text-xl font-semibold pt-4">Your Past Queries</h2>
      
      {isLoading ? (
        <div className="text-center py-8">Loading your queries...</div>
      ) : queries?.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/10 text-muted-foreground">
          You haven't submitted any questions yet.
        </div>
      ) : (
        <div className="space-y-4">
          {queries?.map((q: any) => (
            <Card key={q.id} className={q.status === "answered" ? "border-primary/50" : ""}>
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <div className="font-medium text-sm">You asked:</div>
                  <p className="text-base font-medium">{q.question}</p>
                </div>
                {q.status === "pending" ? (
                  <Badge variant="secondary" className="flex gap-1 shrink-0">
                    <Clock className="h-3 w-3" /> Pending
                  </Badge>
                ) : (
                  <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 flex gap-1 shrink-0">
                    <CheckCircle2 className="h-3 w-3" /> Answered
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                {q.status === "answered" ? (
                  <div className="bg-primary/5 p-4 rounded-md mt-2 border border-primary/10">
                    <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">Admin Reply</div>
                    <p className="text-sm">{q.answer}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic mt-2">Waiting for admin response...</p>
                )}
                <div className="text-xs text-muted-foreground mt-4 text-right">
                  {formatDate(q.timestamp)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
