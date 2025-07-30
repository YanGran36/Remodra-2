import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from '../hooks/use-toast';
import CostAnalysisAssistant from '../components/ai/cost-analysis-assistant';
import { AiAnalysisResult } from '../hooks/use-ai-cost-analysis';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  ArrowLeft,
  ArrowRight, 
  PieChart, 
  FileText, 
  Brain, 
  ChevronRight, 
  Lightbulb, 
  BarChart,
  Sparkles,
  CheckCircle2,
  DollarSign,
  Home
} from "lucide-react";
import TopNav from '../components/layout/top-nav';
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';

export default function AiAssistantPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cost-analysis");
  const [lastAnalysisResult, setLastAnalysisResult] = useState<AiAnalysisResult | null>(null);
  const [jobDescription, setJobDescription] = useState<string>("");

  const handleAnalysisComplete = (result: AiAnalysisResult) => {
    setLastAnalysisResult(result);
    toast({
      title: "Analysis Complete",
      description: "Cost analysis has been completed successfully",
    });
  };

  const handleDescriptionGenerated = (description: string) => {
    setJobDescription(description);
    toast({
      title: "Description Generated",
      description: "Job description has been generated successfully",
    });
  };

  return (
    <div className="remodra-layout">
      <Sidebar />
      <MobileSidebar />
      <div className="remodra-main">
        <TopNav />
        <main className="p-8 space-y-8">
          {/* Header with Remodra branding */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/remodra-logo.png" 
                alt="Remodra Logo" 
                className="h-16 w-16 object-contain"
              />
            </div>
            <h1 className="remodra-title mb-3">
              AI Assistant for Contractors
            </h1>
            <p className="remodra-subtitle">
              AI-powered tools to optimize your estimates and services
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <Button className="remodra-button-outline" onClick={() => setLocation("/")}>
              <Home className="h-5 w-5 mr-2" />
              Dashboard
            </Button>
            <Button className="remodra-button-outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
          </div>

          <Tabs defaultValue="cost-analysis" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-slate-800 border-slate-600 mb-6">
              <TabsTrigger 
                value="cost-analysis" 
                className="flex items-center data-[state=active]:bg-amber-400 data-[state=active]:text-slate-900"
              >
                <PieChart className="w-5 h-5 mr-2" />
                Cost Analysis
              </TabsTrigger>
              
              <TabsTrigger 
                value="job-descriptions" 
                className="flex items-center data-[state=active]:bg-amber-400 data-[state=active]:text-slate-900"
                disabled={!jobDescription}
              >
                <FileText className="w-5 h-5 mr-2" />
                Job Description
              </TabsTrigger>
              
              <TabsTrigger 
                value="insights" 
                className="flex items-center data-[state=active]:bg-amber-400 data-[state=active]:text-slate-900"
                disabled={!lastAnalysisResult}
              >
                <Lightbulb className="w-5 h-5 mr-2" />
                Insights
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="cost-analysis" className="space-y-4">
              {/* Cost analysis introduction */}
              <div className="remodra-card p-6">
                <div className="flex gap-3 items-start">
                  <div className="p-3 rounded-full bg-amber-400/10">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-medium mb-2 text-amber-400">Smart Cost Analysis</h2>
                    <p className="text-slate-300">
                      Our AI assistant analyzes your project details to generate accurate estimates, 
                      optimal margin calculations, and personalized recommendations. Complete the form below 
                      to get a detailed cost breakdown.
                    </p>
                    <div className="mt-4 bg-amber-400/10 border border-amber-400/20 p-3 rounded-md text-amber-300 text-sm">
                      <p className="font-medium mb-1">To use this tool:</p>
                      <ol className="list-decimal pl-5 space-y-1">
                        <li>Select a <span className="font-medium">service type</span></li>
                        <li>Add the <span className="font-medium">materials</span> you will use</li>
                        <li>Provide information about project size and complexity (optional)</li>
                        <li>Click "Analyze Costs" or "Generate Description" as needed</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Main analysis component */}
              <CostAnalysisAssistant 
                onAnalysisComplete={handleAnalysisComplete}
                onDescriptionGenerated={handleDescriptionGenerated}
              />
            </TabsContent>
            
            <TabsContent value="job-descriptions" className="space-y-4">
              {jobDescription ? (
                <div className="remodra-card p-6">
                  <div className="flex items-center mb-4">
                    <FileText className="w-5 h-5 mr-2 text-amber-400" />
                    <h2 className="text-xl font-semibold text-amber-400">Professional Job Description</h2>
                  </div>
                  <p className="text-slate-300 mb-4">Description ready to share with your clients</p>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-slate-800 rounded-lg p-6 whitespace-pre-line border-l-4 border-amber-400 text-slate-300">
                        {jobDescription}
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mt-4">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(jobDescription);
                            toast({
                              title: "Copied to clipboard",
                              description: "The description has been copied to clipboard"
                            });
                          }}
                          className="remodra-button-outline flex-1"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Copy Text
                        </Button>
                        
                        <Button 
                          variant="default"
                          onClick={() => {
                            if (lastAnalysisResult) {
                              // Prepare an email message with the description and price
                              const subject = encodeURIComponent("Work Proposal");
                              const body = encodeURIComponent(
                                `${jobDescription}\n\n` +
                                `Estimated budget: ${new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: 'USD',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(lastAnalysisResult.recommendedTotal)}\n\n` +
                                "For more details, please contact us."
                              );
                              window.open(`mailto:?subject=${subject}&body=${body}`);
                            } else {
                              toast({
                                title: "No cost analysis",
                                description: "To include the budget, you must first generate a cost analysis",
                                variant: "destructive"
                              });
                            }
                          }}
                          className="remodra-button-default flex-1"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Send by Email
                        </Button>
                      </div>
                      
                      <div className="flex flex-col mt-6 space-y-2">
                        <h3 className="text-base font-medium">Usage recommendations:</h3>
                        <ul className="space-y-1 text-sm text-slate-300">
                          <li className="flex items-start">
                            <div className="bg-green-100 text-green-800 rounded-full p-1 mr-2 mt-0.5">
                              <CheckCircle2 className="h-3 w-3" />
                            </div>
                            <span>Use this description in formal proposals</span>
                          </li>
                          <li className="flex items-start">
                            <div className="bg-green-100 text-green-800 rounded-full p-1 mr-2 mt-0.5">
                              <CheckCircle2 className="h-3 w-3" />
                            </div>
                            <span>Include it in contracts or work agreements</span>
                          </li>
                          <li className="flex items-start">
                            <div className="bg-green-100 text-green-800 rounded-full p-1 mr-2 mt-0.5">
                              <CheckCircle2 className="h-3 w-3" />
                            </div>
                            <span>Share it in client communications to clarify expectations</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    {lastAnalysisResult && (
                      <div className="bg-amber-400/10 rounded-lg p-4 border border-amber-400/20 space-y-4">
                        <h3 className="text-base font-medium flex items-center">
                          <DollarSign className="w-4 h-4 mr-2 text-amber-400" />
                          Budget Summary
                        </h3>
                        
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center border-b pb-2">
                            <span className="font-medium">Recommended price:</span>
                            <span className="font-bold text-lg">{new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(lastAnalysisResult.recommendedTotal)}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>Materials:</span>
                            <span>{new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(lastAnalysisResult.breakdown.materials.total)}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>Labor:</span>
                            <span>{new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(lastAnalysisResult.breakdown.labor.total)}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>Operating expenses:</span>
                            <span>{new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(lastAnalysisResult.breakdown.overhead.total)}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>Profit margin:</span>
                            <span>{new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(lastAnalysisResult.breakdown.profit.total)}</span>
                          </div>
                          
                          <div className="mt-3 p-3 bg-slate-700 rounded-md">
                            <h4 className="font-medium mb-1">Competitive analysis:</h4>
                            {lastAnalysisResult.breakdown.competitiveAnalysis && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>Low range:</span>
                                  <span>{new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }).format(lastAnalysisResult.breakdown.competitiveAnalysis.lowRange)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span>High range:</span>
                                  <span>{new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  }).format(lastAnalysisResult.breakdown.competitiveAnalysis.highRange)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button onClick={() => setActiveTab("cost-analysis")}>
                      <PieChart className="w-4 h-4 mr-2" />
                      Back to Analysis
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 mx-auto text-slate-600/20 mb-4" />
                  <h2 className="text-xl font-medium mb-2">No descriptions generated</h2>
                  <p className="text-slate-400 mb-6">
                    To view this content, first generate a description from the Cost Analysis tab
                  </p>
                  <Button onClick={() => setActiveTab("cost-analysis")}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Go to Cost Analysis
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="insights" className="space-y-4">
              {lastAnalysisResult ? (
                <div className="remodra-card p-6">
                  <div className="flex items-center mb-4">
                    <BarChart className="w-5 h-5 mr-2 text-amber-400" />
                    <h2 className="text-xl font-semibold text-amber-400">Insights and Recommendations</h2>
                  </div>
                  <p className="text-slate-300 mb-4">Detailed analysis to help you make better decisions</p>
                  
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="bg-amber-400/10 p-4 rounded-lg">
                      <h3 className="text-lg font-medium mb-2 text-amber-400">Analysis Summary</h3>
                      <p className="text-slate-300">{lastAnalysisResult.summary}</p>
                    </div>
                    
                    {/* Recommendations */}
                    <div>
                      <h3 className="text-lg font-medium mb-3 text-amber-400">Key Recommendations</h3>
                      <ul className="space-y-2">
                        {lastAnalysisResult.breakdown.recommendations.map((rec, index) => (
                          <li key={index} className="bg-slate-800/30 p-3 rounded-md flex items-start">
                            <Lightbulb className="w-5 h-5 text-amber-500 mr-3 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Potential issues */}
                    <div>
                      <h3 className="text-lg font-medium mb-3 text-amber-400">Important Considerations</h3>
                      <ul className="space-y-2">
                        {lastAnalysisResult.breakdown.potentialIssues.map((issue, index) => (
                          <li key={index} className="bg-destructive/5 p-3 rounded-md flex items-start">
                            <div className="w-5 h-5 rounded-full border-2 border-destructive flex items-center justify-center mr-3 shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-destructive">{index + 1}</span>
                            </div>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <Button onClick={() => setActiveTab("cost-analysis")}>
                        <PieChart className="w-4 h-4 mr-2" />
                        Back to Analysis
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <Lightbulb className="w-16 h-16 mx-auto text-slate-600/20 mb-4" />
                  <h2 className="text-xl font-medium mb-2">No insights available</h2>
                  <p className="text-slate-400 mb-6">
                    To view this content, first perform a cost analysis from the Analysis tab
                  </p>
                  <Button onClick={() => setActiveTab("cost-analysis")}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Go to Cost Analysis
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}