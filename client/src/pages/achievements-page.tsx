import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function AchievementsPage() {
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
              <h1 className="text-3xl font-bold text-amber-400 mb-2">Achievements</h1>
              <p className="text-slate-400">Track your progress and accomplishments</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-amber-400">Your Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-slate-400">Achievements functionality coming soon</p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
} 