import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';

export default function LeadCapturePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-900">R</span>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-200">Get a Quote</CardTitle>
          <p className="text-slate-400">Tell us about your project</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Input placeholder="Name" className="remodra-input w-full" />
            </div>
            <div>
              <Input type="email" placeholder="Email" className="remodra-input w-full" />
            </div>
            <div>
              <Input placeholder="Phone" className="remodra-input w-full" />
            </div>
            <div>
              <Textarea placeholder="Project Description" className="remodra-input w-full" />
            </div>
            <Button className="remodra-button w-full">
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 