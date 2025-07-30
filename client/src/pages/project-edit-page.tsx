import React from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft } from "lucide-react";
import Sidebar from '../components/layout/sidebar';
import MobileSidebar from '../components/layout/mobile-sidebar';
import TopNav from '../components/layout/top-nav';
import { apiRequest } from '../lib/queryClient';
import { useToast } from '../hooks/use-toast';
import { Link } from 'wouter';
import ErrorBoundary from '../components/error-boundary';

export default function ProjectEditPage() {
  const [, params] = useRoute('/projects/:id/edit');
  const projectId = params?.id;
  const { toast } = useToast();

  // Fetch project details
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['/api/protected/projects', projectId],
    queryFn: async () => {
      try {
        console.log('Fetching project details for edit, ID:', projectId);
        const response = await apiRequest("GET", `/api/protected/projects/${projectId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Project data for edit received:', data);
        return data;
      } catch (err) {
        console.error('Error fetching project for edit:', err);
        throw err;
      }
    },
    enabled: !!projectId,
    retry: 1,
    retryDelay: 1000
  });

  if (isLoading) {
    return (
      <div className="remodra-layout">
        <Sidebar />
        <MobileSidebar />
        <div className="remodra-main">
          <TopNav />
          <div className="remodra-content">
            <main className="p-8">
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <div className="text-2xl mb-4">⏳</div>
                    <div className="text-lg font-semibold text-slate-200">Loading Project...</div>
                  </div>
                </CardContent>
              </Card>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="remodra-layout">
        <Sidebar />
        <MobileSidebar />
        <div className="remodra-main">
          <TopNav />
          <div className="remodra-content">
            <main className="p-8">
              <Card className="bg-slate-800 border-slate-600">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">⚠️</div>
                    <div className="text-xl font-semibold text-red-400">Project Not Found</div>
                    <div className="text-slate-400 mt-2">
                      The project you're looking for doesn't exist or you don't have permission to edit it.
                    </div>
                    <Button className="mt-4" asChild>
                      <Link href="/projects">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Projects
                      </Link>
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

  return (
    <ErrorBoundary>
      <div className="remodra-layout">
        <Sidebar />
        <MobileSidebar />
        <div className="remodra-main">
          <TopNav />
          <div className="remodra-content">
            <main className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" asChild>
                    <Link href={`/projects/${project?.id || 'unknown'}`}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Project
                    </Link>
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-200">
                      Edit Project
                    </h1>
                    <p className="text-slate-400">
                      {project?.title || 'Untitled Project'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Edit Form Placeholder */}
              <Card className="bg-slate-800 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-amber-400">Edit Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔧</div>
                    <div className="text-lg font-semibold text-slate-200">Edit Form Coming Soon</div>
                    <div className="text-slate-400 mt-2">
                      The project edit form will be implemented here.
                    </div>
                    <Button
                      className="mt-4"
                      onClick={() => {
                        toast({
                          title: "Edit Project",
                          description: "Project edit functionality will be implemented here.",
                        });
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 