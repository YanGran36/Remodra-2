import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Wrench, 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Shield, 
  Zap,
  CheckCircle,
  Star
} from 'lucide-react';

export default function Landing() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: FileText,
      title: "Professional Estimates",
      description: "Create detailed estimates with AI-powered cost analysis"
    },
    {
      icon: Users,
      title: "Client Management",
      description: "Organize client information and communication"
    },
    {
      icon: Wrench,
      title: "Project Tracking",
      description: "Monitor project progress and timelines"
    },
    {
      icon: Calendar,
      title: "Scheduling",
      description: "Manage appointments and field agents"
    },
    {
      icon: TrendingUp,
      title: "Business Analytics",
      description: "Track performance and growth metrics"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security for your data"
    }
  ];

  const testimonials = [
    {
      name: "John Smith",
      company: "Smith Contracting",
      rating: 5,
      text: "Remodra has transformed how we manage our projects. The estimates are professional and accurate."
    },
    {
      name: "Sarah Johnson",
      company: "Johnson Builders",
      rating: 5,
      text: "The client management features are incredible. Our workflow is now 3x more efficient."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <img 
            src="/remodra-logo.png" 
            alt="Remodra Logo" 
            className="h-10 w-10 object-contain"
          />
          <span className="text-2xl font-bold text-amber-400">Remodra</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => setLocation('/pricing')}
            className="text-slate-300 hover:text-amber-400"
          >
            Pricing
          </Button>
          <Button
            variant="ghost"
            onClick={() => setLocation('/simple-login')}
            className="text-slate-300 hover:text-amber-400"
          >
            Sign In
          </Button>
          <Button
            onClick={() => setLocation('/auth')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900"
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="text-center py-20 px-6 max-w-6xl mx-auto">
        <div className="flex justify-center mb-8">
          <img 
            src="/remodra-logo.png" 
            alt="Remodra Logo" 
            className="h-24 w-24 object-contain"
          />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Professional Contractor
          <span className="text-amber-400"> Management</span>
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
          Streamline your contracting business with AI-powered estimates, client management, 
          and project tracking. Built by contractors, for contractors.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            onClick={() => setLocation('/auth')}
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 text-lg px-8 py-3"
          >
            <Zap className="mr-2 h-5 w-5" />
            Start Free Trial
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setLocation('/simple-login')}
            className="text-slate-300 border-slate-600 hover:bg-slate-800 text-lg px-8 py-3"
          >
            Demo Login
          </Button>
        </div>
        
        {/* Trust Indicators */}
        <div className="flex justify-center items-center space-x-8 text-slate-400">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span>30-day free trial</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <span>Secure & reliable</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-400" />
            <span>4.9/5 rating</span>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Powerful tools designed specifically for contractors to grow their business
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 hover:border-amber-500 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-amber-500/20 rounded-lg">
                    <feature.icon className="h-6 w-6 text-amber-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-300">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by Contractors Nationwide
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-300 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-slate-400">{testimonial.company}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Business?
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
              Start Your Free Trial
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setLocation('/pricing')}
              className="text-slate-300 border-slate-600 hover:bg-slate-800 text-lg px-8 py-3"
            >
              View Pricing Plans
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-700">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <img 
              src="/remodra-logo.png" 
              alt="Remodra Logo" 
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold text-amber-400">Remodra</span>
          </div>
          <p className="text-slate-400 mb-4">
            Professional contractor management system
          </p>
          <div className="flex justify-center space-x-6 text-sm text-slate-500">
            <span>© 2025 Remodra. All rights reserved.</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
} 