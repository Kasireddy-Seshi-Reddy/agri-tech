import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Leaf } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Auth() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const loginForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
  });

  const forgotPasswordForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest("POST", "/api/reset-password", {
        username: data.username,
        newPassword: data.password,
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
    },
    onSuccess: () => {
      toast({
        title: "Password Reset successfully",
        description: "You can now log in with your new password.",
      });
      setIsForgotPasswordOpen(false);
      forgotPasswordForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reset password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">AgriTech</h1>
          <p className="text-muted-foreground mt-2">Sign in to your dashboard</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card className="border-muted shadow-sm">
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account.
                </CardDescription>
              </CardHeader>
              <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Email</Label>
                    <Input id="username" type="email" placeholder="farmer@example.com" {...loginForm.register("username")} required />
                    {loginForm.formState.errors.username && (
                      <p className="text-xs text-destructive mt-1">{loginForm.formState.errors.username.message as string}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                        <DialogTrigger asChild>
                          <span className="text-xs text-primary cursor-pointer hover:underline">Forgot password?</span>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Reset Password</DialogTitle>
                            <DialogDescription>
                              Enter your registered email and your new password.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={forgotPasswordForm.handleSubmit((data) => resetPasswordMutation.mutate(data))}>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="reset-email">Email</Label>
                                <Input id="reset-email" type="email" placeholder="farmer@example.com" {...forgotPasswordForm.register("username")} required />
                                {forgotPasswordForm.formState.errors.username && (
                                  <p className="text-xs text-destructive mt-1">{forgotPasswordForm.formState.errors.username.message as string}</p>
                                )}
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="reset-password">New Password</Label>
                                <Input id="reset-password" type="password" {...forgotPasswordForm.register("password")} required />
                                {forgotPasswordForm.formState.errors.password && (
                                  <p className="text-xs text-destructive mt-1">{forgotPasswordForm.formState.errors.password.message as string}</p>
                                )}
                              </div>
                            </div>
                            <Button type="button" onClick={forgotPasswordForm.handleSubmit((data) => resetPasswordMutation.mutate(data))} className="w-full" disabled={resetPasswordMutation.isPending}>
                              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Input id="password" type="password" {...loginForm.register("password")} required />
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-destructive mt-1">{loginForm.formState.errors.password.message as string}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="register">
            <Card className="border-muted shadow-sm">
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                  Start monitoring your crops today.
                </CardDescription>
              </CardHeader>
              <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">Email</Label>
                    <Input id="reg-username" type="email" placeholder="farmer@example.com" {...registerForm.register("username")} required />
                    {registerForm.formState.errors.username && (
                      <p className="text-xs text-destructive mt-1">{registerForm.formState.errors.username.message as string}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input id="reg-password" type="password" {...registerForm.register("password")} required />
                    {registerForm.formState.errors.password && (
                      <p className="text-xs text-destructive mt-1">{registerForm.formState.errors.password.message as string}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "Creating account..." : "Create Account"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
