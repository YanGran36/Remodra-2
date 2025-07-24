import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import LeadCaptureForm from "../components/leads/lead-capture-form";

export default function LeadCapturePage() {
  const [, setLocation] = useLocation();

  const handleSuccess = (data: any) => {
    // Navigate to calendar to show the scheduled meeting
    setLocation("/calendar");
  };

  const handleCancel = () => {
    setLocation("/");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">New Client</h1>
            <p className="text-muted-foreground">Capture and manage new potential clients</p>
          </div>
        </div>
      </div>

      <LeadCaptureForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}