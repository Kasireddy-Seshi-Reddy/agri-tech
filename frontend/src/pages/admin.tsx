import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShieldAlert, Users, Sprout, MessageSquare, Activity, ShieldCheck, User, Ban, CheckCircle2, Send, HelpCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Admin() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [replyText, setReplyText] = useState<{ [key: number]: string }>({});

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, isBanned }: { userId: string, isBanned: boolean }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/ban`, { isBanned });
      if (!res.ok) {
        throw new Error("Failed to update user status");
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: variables.isBanned ? "User Banned" : "User Unbanned",
        description: `The user has been successfully ${variables.isBanned ? "banned" : "unbanned"}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const answerQueryMutation = useMutation({
    mutationFn: async ({ queryId, answer }: { queryId: number, answer: string }) => {
      const res = await apiRequest("POST", `/api/admin/queries/${queryId}/answer`, { answer });
      if (!res.ok) {
        throw new Error("Failed to submit answer");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/queries"] });
      setReplyText({});
      toast({
        title: "Answer Submitted",
        description: "The user's query has been answered successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["/api/admin/overview"],
    enabled: user?.username === "capteam@gmail.com",
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: user?.username === "capteam@gmail.com",
  });

  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ["/api/admin/predictions"],
    enabled: user?.username === "capteam@gmail.com",
  });

  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ["/api/admin/chats"],
    enabled: user?.username === "capteam@gmail.com",
  });

  const { data: adminQueries, isLoading: adminQueriesLoading } = useQuery({
    queryKey: ["/api/admin/queries"],
    enabled: user?.username === "capteam@gmail.com",
  });

  if (isAuthLoading) return null;

  if (user?.username !== "capteam@gmail.com") {
    return <Redirect to="/dashboard" />;
  }

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("en-IN", {
        month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Admin Portal
          </h1>
          <p className="text-muted-foreground mt-1">
            Global oversight and platform management.
          </p>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Logged in as Administrator
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 md:w-[750px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="chats">Chat Logs</TabsTrigger>
          <TabsTrigger value="queries">Support Queries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewLoading ? "..." : overview?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">Registered accounts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
                <Sprout className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewLoading ? "..." : overview?.totalPredictions || 0}</div>
                <p className="text-xs text-muted-foreground">ML inferences performed</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Interactions</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overviewLoading ? "..." : overview?.totalChats || 0}</div>
                <p className="text-xs text-muted-foreground">Messages exchanged</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Registered Users</CardTitle>
              <CardDescription>A complete list of all users on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-4">Loading users...</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>User ID</TableHead>
                        <TableHead>Username / Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No other users have registered yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        users?.map((u: any) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-mono text-xs">{u.id}</TableCell>
                            <TableCell className="font-medium flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {u.username}
                            </TableCell>
                            <TableCell>
                              {u.username === "capteam@gmail.com" ? (
                                <Badge className="bg-primary/20 text-primary hover:bg-primary/30">Admin</Badge>
                              ) : u.isBanned ? (
                                <Badge variant="destructive">Banned</Badge>
                              ) : (
                                <Badge variant="secondary">User</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {u.username !== "capteam@gmail.com" && (
                                <Button
                                  variant={u.isBanned ? "outline" : "destructive"}
                                  size="sm"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to ${u.isBanned ? "unban" : "ban"} this user?`)) {
                                      banUserMutation.mutate({ userId: u.id, isBanned: !u.isBanned });
                                    }
                                  }}
                                  disabled={banUserMutation.isPending}
                                >
                                  {u.isBanned ? (
                                    <>
                                      <CheckCircle2 className="h-4 w-4 mr-2" /> Unban
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="h-4 w-4 mr-2" /> Ban
                                    </>
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Predictions</CardTitle>
              <CardDescription>Recent manual predictions made across all accounts.</CardDescription>
            </CardHeader>
            <CardContent>
              {predictionsLoading ? (
                <div className="text-center py-4">Loading predictions...</div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Date</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>N-P-K</TableHead>
                        <TableHead>Moisture</TableHead>
                        <TableHead>pH</TableHead>
                        <TableHead>Health</TableHead>
                        <TableHead>Prediction</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {predictions?.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="whitespace-nowrap text-xs">{formatDate(p.timestamp)}</TableCell>
                          <TableCell className="font-mono text-xs max-w-[100px] truncate" title={p.userId}>{p.userId}</TableCell>
                          <TableCell className="whitespace-nowrap">{p.sensorData.N}-{p.sensorData.P}-{p.sensorData.K}</TableCell>
                          <TableCell>{p.sensorData.moisture}%</TableCell>
                          <TableCell>{p.sensorData.ph}</TableCell>
                          <TableCell>{p.soilHealthIndex}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline">{p.prediction.crop}</Badge>
                              <span className="text-xs text-muted-foreground">{p.prediction.confidence}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Global Chat Logs</CardTitle>
              <CardDescription>Recent interactions with the AI assistant across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              {chatsLoading ? (
                <div className="text-center py-4">Loading chat logs...</div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
                  {chats?.slice().reverse().map((chat: any) => (
                    <div key={chat.id} className="border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={chat.role === "assistant" ? "default" : "secondary"}>
                          {chat.role === "assistant" ? "AI Assistant" : "User"}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground">User ID: {chat.userId}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{chat.content}</p>
                    </div>
                  ))}
                  {chats?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No chat history found.</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Support Queries</CardTitle>
              <CardDescription>Respond to pending questions from users across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              {adminQueriesLoading ? (
                <div className="text-center py-4">Loading queries...</div>
              ) : (
                <div className="space-y-6 max-h-[800px] overflow-y-auto pr-4">
                  {adminQueries?.map((q: any) => (
                    <div key={q.id} className={`border rounded-lg p-4 ${q.status === "answered" ? "bg-muted/5" : "bg-card shadow-sm"}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">User ID: {q.userId}</span>
                            <span className="text-xs text-muted-foreground">{formatDate(q.timestamp)}</span>
                          </div>
                          <p className="font-medium text-base">{q.question}</p>
                        </div>
                        <Badge variant={q.status === "answered" ? "outline" : "default"} className={q.status === "answered" ? "text-green-600 border-green-200 bg-green-50" : ""}>
                          {q.status === "answered" ? "Answered" : "Pending Action"}
                        </Badge>
                      </div>

                      {q.status === "pending" ? (
                        <div className="mt-4 space-y-3">
                          <Textarea 
                            placeholder="Type your response here..." 
                            className="min-h-[80px]"
                            value={replyText[q.id] || ""}
                            onChange={(e) => setReplyText(prev => ({ ...prev, [q.id]: e.target.value }))}
                          />
                          <div className="flex justify-end">
                            <Button 
                              size="sm"
                              disabled={!replyText[q.id]?.trim() || answerQueryMutation.isPending}
                              onClick={() => answerQueryMutation.mutate({ queryId: q.id, answer: replyText[q.id] })}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Submit Answer
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 bg-muted/50 p-3 rounded-md border text-sm">
                          <span className="font-semibold text-primary block mb-1">Your Answer:</span>
                          {q.answer}
                        </div>
                      )}
                    </div>
                  ))}
                  {adminQueries?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No queries in the system.</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
