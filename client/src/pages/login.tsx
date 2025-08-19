import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
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

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login: authLogin } = useAuth();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return await response.json();
    },
    onSuccess: (data) => {
      authLogin(data.user);
      toast({
        title: 'Login successful',
        description: `Welcome back, ${data.user.name}!`,
      });
      navigate('/dashboard');
    },
    onError: (error: any) => {
      setError(error.message || 'Login failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    loginMutation.mutate({ username, password });
  };

  const testUsers = [
    { username: 'msc_cz_import', name: 'MSC CZ Import User' },
    { username: 'msc_cz_export', name: 'MSC CZ Export User' },
    { username: 'msc_sk_import', name: 'MSC SK Import User' },
    { username: 'msc_sk_export', name: 'MSC SK Export User' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Poštolka Logistics</CardTitle>
          <CardDescription>
            Sign in to access the logistics management platform
          </CardDescription>
        </CardHeader>
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

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
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

          <div className="mt-6">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Test Users:</div>
            <div className="space-y-1">
              {testUsers.map((user) => (
                <button
                  key={user.username}
                  onClick={() => {
                    setUsername(user.username);
                    setPassword('password123');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 block"
                  data-testid={`button-test-user-${user.username}`}
                >
                  {user.name} ({user.username})
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">Password: password123</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}