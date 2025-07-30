import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';

export default function EventsPage() {
  return (
    <div className="remodra-layout">
      <div className="remodra-main">
        <div className="remodra-content">
          <main className="p-8 space-y-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <img 
                  src="/remodra-logo.png" 
                  alt="Remodra Logo" 
                  className="h-16 w-16 object-contain"
                />
              </div>
              <h1 className="text-3xl font-bold text-amber-400 mb-2">Events</h1>
              <p className="text-slate-400">Manage your events and appointments</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-amber-400">Events Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-4">Events functionality coming soon</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
} 