import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import type { User } from '@shared/schema';

interface LoginResponse {
  user: Omit<User, 'password'>;
  message: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState('medlog_admin');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.name}!`,
      });
      navigate('/dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || 'Invalid credentials',
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Invalid credentials",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Poštolka</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the logistics management platform
          </p>
        </div>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                data-testid="input-username"
                disabled={loginMutation.isPending}
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                data-testid="input-password"
                disabled={loginMutation.isPending}
              />
            </div>

            {loginMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>{loginMutation.error.message || 'Login failed'}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full"
              data-testid="button-login"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Test Users Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Test Users:</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">Medlog Admin (Full Access):</span> 
                <span className="text-blue-600 ml-1">medlog_admin</span>
              </div>
              <div>
                <span className="font-medium">MSC CZ Import User:</span> 
                <span className="text-blue-600 ml-1">msc_cz_user</span>
              </div>
              <div>
                <span className="font-medium">ŠKODA AUTO Client:</span> 
                <span className="text-blue-600 ml-1">jan_novak</span>
              </div>
              <div>
                <span className="font-medium">TESCO Client:</span> 
                <span className="text-blue-600 ml-1">eva_svobodova</span>
              </div>
              <div>
                <span className="font-medium">IKEA Client:</span> 
                <span className="text-blue-600 ml-1">tomas_dvorak</span>
              </div>
              <div>
                <span className="font-medium">NTB Client:</span> 
                <span className="text-blue-600 ml-1">marie_cerna</span>
              </div>
              <div>
                <span className="font-medium">AUDI Client:</span> 
                <span className="text-blue-600 ml-1">petr_prochazka</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="font-medium text-gray-900">Password:</span> 
                <span className="text-blue-600 ml-1">password123</span>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </div>
  );
}