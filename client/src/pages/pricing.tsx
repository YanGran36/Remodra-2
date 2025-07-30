import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Check, Crown, Zap, Clock, CreditCard, Users, Star, ArrowLeft } from "lucide-react";
import { useAuth } from '../hooks/use-auth';
import { Link, useLocation } from "wouter";

const PricingPage = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const plans = [
    {
      name: "Basic",
      price: 29,
      description: "Perfect for small contractors just getting started",
      features: [
        "Up to 10 clients",
        "Unlimited estimates & invoices",
        "Client portal access",
        "Basic support"
      ],
      limitations: [
        "No AI cost analysis",
        "No time clock",
        "No Stripe integration"
      ],
      icon: Users,
      color: "amber",
      popular: false
    },
    {
      name: "Pro",
      price: 59,
      description: "Most popular for growing contractor businesses",
      features: [
        "Up to 50 clients",
        "AI-generated estimates",
        "Time clock functionality",
        "Custom client portal",
        "10 AI analyses per month",
        "Priority support"
      ],
      limitations: [
        "No Stripe integration",
        "Limited AI usage"
      ],
      icon: Zap,
      color: "amber",
      popular: true
    },
    {
      name: "Business",
      price: 99,
      description: "Complete solution for established contractors",
      features: [
        "Unlimited clients",
        "Unlimited AI cost analysis",
        "Stripe integration",
        "Fully branded portal",
        "Time clock functionality",
        "Premium support",
        "Custom integrations"
      ],
      limitations: [],
      icon: Crown,
      color: "amber",
      popular: false
    }
  ];

  const handleSubscribe = (planName: string) => {
    if (!user) {
      // Redirect to register/login with plan selection
      setLocation(`/auth?plan=${planName.toLowerCase()}`);
      return;
    }
    
    // If user is logged in, redirect to billing/upgrade page
    setLocation(`/billing/upgrade?plan=${planName.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Navigation */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="text-slate-400 hover:text-amber-400"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img 
              src="/remodra-logo.png" 
              alt="Remodra Logo" 
              className="h-16 w-16 object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Choose Your <span className="text-amber-400">Remodra</span> Plan
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Powerful contractor management tools that grow with your business. 
            Start your 14-day free trial today.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <Card 
                key={plan.name} 
                className={`relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 ${
                  plan.popular 
                    ? 'border-2 border-amber-500 shadow-2xl scale-105' 
                    : 'border shadow-lg hover:shadow-xl transition-shadow hover:border-amber-500'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-amber-500 text-slate-900 text-center py-2 text-sm font-semibold">
                    <Star className="inline h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                )}
                
                <CardHeader className={`text-center ${plan.popular ? 'pt-12' : 'pt-8'}`}>
                  <div className="mx-auto mb-4 p-3 rounded-full bg-amber-500/20">
                    <IconComponent className="h-8 w-8 text-amber-400" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">
                      ${plan.price}
                    </span>
                    <span className="text-slate-400">/month</span>
                  </div>
                  <p className="text-slate-300 mt-2">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-amber-400">
                      Included Features:
                    </h4>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Check className="h-4 w-4 text-amber-400 flex-shrink-0" />
                        <span className="text-sm text-slate-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-400">
                        Not Included:
                      </h4>
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="h-4 w-4 rounded-full bg-slate-600 flex-shrink-0" />
                          <span className="text-sm text-slate-400">
                            {limitation}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button 
                    onClick={() => handleSubscribe(plan.name)}
                    className={`w-full mt-6 ${
                      plan.popular 
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-900' 
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-900'
                    }`}
                    size="lg"
                  >
                    {user ? 'Upgrade Now' : 'Start Free Trial'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              All Plans Include
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-amber-500/20 w-16 h-16 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">14-Day Free Trial</h3>
                <p className="text-slate-300">Try any plan risk-free for 14 days</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-amber-500/20 w-16 h-16 flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Cancel Anytime</h3>
                <p className="text-slate-300">No long-term contracts or hidden fees</p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-amber-500/20 w-16 h-16 flex items-center justify-center">
                  <Users className="h-8 w-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">24/7 Support</h3>
                <p className="text-slate-300">Get help whenever you need it</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Join thousands of contractors who trust Remodra to manage their business
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setLocation('/auth')}
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 text-lg px-8 py-3"
              >
                Start Free Trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setLocation('/simple-login')}
                className="text-slate-300 border-slate-600 hover:bg-slate-800 text-lg px-8 py-3"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;