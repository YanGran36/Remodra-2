import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../hooks/use-auth';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';

export default function SimpleLogin() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const { loginMutation } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  // Redirect to dashboard if login is successful
  React.useEffect(() => {
    if (loginMutation.isSuccess) {
      setLocation('/dashboard');
    }
  }, [loginMutation.isSuccess, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Landing */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="text-slate-400 hover:text-amber-400"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-6">
              <img 
                src="/remodra-logo.png" 
                alt="Remodra Logo" 
                className="h-16 w-16 object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-white mb-2">Welcome Back</CardTitle>
            <p className="text-slate-400">Sign in to your Remodra account</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              {loginMutation.isError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">
                    {loginMutation.error?.message || 'Invalid email or password'}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900 mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-slate-400">Or</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => setLocation('/auth')}
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Create New Account
              </Button>
              <Button
                variant="ghost"
                onClick={() => setLocation('/pricing')}
                className="w-full text-slate-400 hover:text-amber-400"
              >
                View Pricing Plans
              </Button>
            </div>

            {/* Demo Account Info */}
            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <h4 className="text-sm font-semibold text-amber-400 mb-2">Demo Account</h4>
              <div className="text-xs text-slate-400 space-y-1">
                <p><strong>Email:</strong> test@remodra.com</p>
                <p><strong>Password:</strong> test123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 