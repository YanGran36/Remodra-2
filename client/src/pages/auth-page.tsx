import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Check, Crown, Zap, Users, ArrowLeft, Lock, Eye, EyeOff, UserPlus, Shield, Star, Sparkles, Award, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
    phone: ''
  });
  
  const { loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 29,
      icon: Users,
      features: ['Up to 10 clients', 'Basic estimates', 'Project tracking', 'Client portal', 'Email support'],
      popular: false,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 59,
      icon: Zap,
      features: ['Up to 50 clients', 'AI analysis', 'Time clock', 'Custom portal', '10 AI analyses/month', 'Priority support'],
      popular: true,
      gradient: 'from-amber-500 to-orange-500'
    },
    {
      id: 'business',
      name: 'Business',
      price: 99,
      icon: Crown,
      features: ['Unlimited clients', 'All features', 'Stripe integration', 'Fully branded portal', 'Unlimited AI', 'Dedicated support'],
      popular: false,
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      loginMutation.mutate({ 
        email: formData.email, 
        password: formData.password 
      });
    } else {
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      
      registerMutation.mutate({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        companyName: formData.companyName,
        username: formData.email.split('@')[0] // Generate username from email
      });
    }
  };

  // Redirect on successful auth
  React.useEffect(() => {
    if (loginMutation.isSuccess || registerMutation.isSuccess) {
      setLocation('/dashboard');
    }
  }, [loginMutation.isSuccess, registerMutation.isSuccess, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Navigation */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="text-slate-400 hover:text-amber-400 transition-colors duration-200 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Home
          </Button>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <img 
                src="/remodra-logo.png" 
                alt="Remodra Logo" 
                className="h-16 w-16 object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {isLogin ? 'Welcome Back' : 'Join Remodra'}
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              {isLogin 
                ? 'Sign in to your Remodra account and continue managing your contracting business'
                : 'Start your free trial and transform how you manage your contracting business'
              }
            </p>
            
            {/* Trust Badges */}
            <div className="flex justify-center items-center space-x-6 mt-6">
              <div className="flex items-center space-x-2 text-slate-400">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium">Enterprise Security</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400">
                <Clock className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium">14-Day Free Trial</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-400">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium">4.9/5 Rating</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {/* Auth Form */}
            <div>
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/50 shadow-2xl backdrop-blur-sm">
                <CardHeader className="text-center pb-6">
                  <div className="mx-auto mb-3 w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    {isLogin ? (
                      <Lock className="h-6 w-6 text-white" />
                    ) : (
                      <UserPlus className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">
                    {isLogin ? 'Sign In to Your Account' : 'Create Your Account'}
                  </CardTitle>
                  <p className="text-slate-400">
                    {isLogin ? 'Access your dashboard and projects' : 'Get started with your free trial'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(value) => setIsLogin(value === 'login')}>
                    <TabsList className="grid w-full grid-cols-2 bg-slate-700/50 p-1 rounded-xl">
                      <TabsTrigger 
                        value="login" 
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger 
                        value="register" 
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Sign Up
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login" className="space-y-4">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-300">Email Address</label>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 h-11 transition-all duration-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-300">Password</label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              required
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 h-11 pr-12 transition-all duration-200"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-amber-400 transition-colors duration-200"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        
                        {loginMutation.isError && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-400 text-sm font-medium">
                              {loginMutation.error?.message || 'Invalid email or password'}
                            </p>
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold h-11 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                    </TabsContent>
                    
                    <TabsContent value="register" className="space-y-4">
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">First Name</label>
                            <Input
                              placeholder="Enter first name"
                              value={formData.firstName}
                              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                              required
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 h-11 transition-all duration-200"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Last Name</label>
                            <Input
                              placeholder="Enter last name"
                              value={formData.lastName}
                              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                              required
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 h-11 transition-all duration-200"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-300">Email Address</label>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 h-11 transition-all duration-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-300">Company Name</label>
                          <Input
                            placeholder="Enter company name"
                            value={formData.companyName}
                            onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                            required
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 h-11 transition-all duration-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-300">Phone (Optional)</label>
                          <Input
                            placeholder="Enter phone number"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 h-11 transition-all duration-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-300">Password</label>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a password"
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              required
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 h-11 pr-12 transition-all duration-200"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-amber-400 transition-colors duration-200"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-300">Confirm Password</label>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                              required
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-500/20 h-11 pr-12 transition-all duration-200"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-amber-400 transition-colors duration-200"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                        
                        {registerMutation.isError && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-400 text-sm font-medium">
                              {registerMutation.error?.message || 'Error creating account'}
                            </p>
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold h-11 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Creating account...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <UserPlus className="h-4 w-4 mr-2" />
                              Create Account
                            </div>
                          )}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Plan Selection */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/50 shadow-2xl backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-3 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">Choose Your Plan</CardTitle>
                  <p className="text-slate-400">Select the plan that fits your business needs</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plans.map((plan) => {
                    const IconComponent = plan.icon;
                    return (
                      <div
                        key={plan.id}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                          selectedPlan === plan.id
                            ? 'border-amber-500 bg-gradient-to-r from-amber-500/10 to-orange-500/10 shadow-lg shadow-amber-500/20'
                            : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                        }`}
                        onClick={() => setSelectedPlan(plan.id)}
                      >
                        {plan.popular && (
                          <div className="flex items-center justify-center mb-3">
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Most Popular
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${plan.gradient} shadow-lg`}>
                              <IconComponent className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                              <p className="text-sm text-slate-400">${plan.price}/month</p>
                            </div>
                          </div>
                          {selectedPlan === plan.id && (
                            <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />
                              <span className="text-slate-300 text-xs">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-xl border border-slate-600">
                    <h4 className="font-bold text-white text-base mb-2">
                      Selected Plan: {plans.find(p => p.id === selectedPlan)?.name}
                    </h4>
                    <p className="text-slate-400 mb-2 text-sm">
                      ${plans.find(p => p.id === selectedPlan)?.price}/month
                    </p>
                    <div className="flex items-center text-xs text-slate-400">
                      <Shield className="h-3 w-3 mr-1 text-green-400" />
                      14-day free trial included • Cancel anytime
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Indicators */}
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/50 shadow-2xl backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="font-bold text-white text-lg mb-4 text-center">Why Choose Remodra?</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="p-1.5 rounded-lg bg-green-500/20">
                        <Check className="h-4 w-4 text-green-400" />
                      </div>
                      <span className="text-slate-300 text-sm font-medium">14-day free trial, no credit card required</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="p-1.5 rounded-lg bg-blue-500/20">
                        <Shield className="h-4 w-4 text-blue-400" />
                      </div>
                      <span className="text-slate-300 text-sm font-medium">Enterprise-grade security & compliance</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <div className="p-1.5 rounded-lg bg-yellow-500/20">
                        <Star className="h-4 w-4 text-yellow-400" />
                      </div>
                      <span className="text-slate-300 text-sm font-medium">4.9/5 rating from 10,000+ contractors</span>
                    </div>
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="p-1.5 rounded-lg bg-purple-500/20">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                      </div>
                      <span className="text-slate-300 text-sm font-medium">AI-powered estimates & insights</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 