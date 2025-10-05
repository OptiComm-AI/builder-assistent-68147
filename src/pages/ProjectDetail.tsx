import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Temporary untyped alias until types regenerate
const sb = supabase as unknown as any;
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ArrowLeft, Calendar, DollarSign, Edit, Trash2, Sparkles, Package, MessageSquare } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import AIChat from "@/components/AIChat";
import ProjectMaterials from "@/components/ProjectMaterials";

const ProjectDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await sb
        .from("projects")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await sb
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading || !user) return null;
  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!project) return <div className="p-8">Project not found</div>;

  const statusColors = {
    planning: "bg-blue-500",
    in_progress: "bg-yellow-500",
    completed: "bg-green-500",
    on_hold: "bg-gray-500",
  };

  // Check if project needs onboarding
  const needsOnboarding = () => {
    if (!project) return false;
    const criticalFieldsMissing = [
      !project.description || project.description.trim().length < 20,
      !project.budget && !project.budget_estimate,
      !project.key_features || project.key_features.length === 0,
      !project.phase || project.phase === "planning"
    ];
    return criticalFieldsMissing.filter(Boolean).length >= 2;
  };

  const handleProjectDataExtracted = () => {
    setShowUpdateNotification(true);
    setTimeout(() => setShowUpdateNotification(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </nav>

      {showUpdateNotification && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 animate-fade-in">
          <div className="container mx-auto flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>💡 Project details updated from conversation</span>
          </div>
        </div>
      )}

      {/* Mobile: Collapsible sections */}
      <div className="lg:hidden px-4 py-6 space-y-4">
        <div className="mb-4">
          <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
          <Badge className={statusColors[project.status as keyof typeof statusColors]}>
            {project.status?.replace("_", " ").toUpperCase() || "PLANNING"}
          </Badge>
        </div>

        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-lg border">
            <h2 className="text-lg font-semibold">Project Details</h2>
            <Sparkles className="h-5 w-5" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
            {renderProjectDetails()}
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-lg border">
            <h2 className="text-lg font-semibold">Materials & Shopping</h2>
            <Package className="h-5 w-5" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <ProjectMaterials projectId={project.id} />
          </CollapsibleContent>
        </Collapsible>

        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-lg border">
            <h2 className="text-lg font-semibold">AI Chat</h2>
            <MessageSquare className="h-5 w-5" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="h-[600px]">
              <AIChat 
                projectId={project.id} 
                mode="dedicated"
                onProjectDataExtracted={handleProjectDataExtracted}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Desktop: Three-column resizable layout */}
      <div className="hidden lg:block h-[calc(100vh-8rem)]">
        <ResizablePanelGroup direction="horizontal" className="w-full">
          {/* LEFT COLUMN - Project Info */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full overflow-y-auto px-4 py-6 pr-2">
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
                <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                  {project.status?.replace("_", " ").toUpperCase() || "PLANNING"}
                </Badge>
              </div>
              <div className="space-y-6">
                {renderProjectDetails()}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* CENTER COLUMN - Materials & Shopping */}
          <ResizablePanel defaultSize={40} minSize={30} maxSize={50}>
            <div className="h-full overflow-y-auto px-4 py-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Materials & Shopping</h2>
              </div>
              <ProjectMaterials projectId={project.id} />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* RIGHT COLUMN - AI Chat */}
          <ResizablePanel defaultSize={35} minSize={25} maxSize={45}>
            <div className="h-full flex flex-col px-4 py-6 pl-2">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">AI Assistant</h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <AIChat 
                  projectId={project.id} 
                  mode="dedicated"
                  onProjectDataExtracted={handleProjectDataExtracted}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );

  function renderProjectDetails() {
    return (
      <>
        {/* AI Insights Card */}
        {(project.key_features?.length || project.materials_mentioned?.length || project.style_preferences?.length || project.budget_estimate || project.timeline_weeks) && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI-Extracted Insights
                </CardTitle>
                {project.last_chat_update && (
                  <span className="text-xs text-muted-foreground">
                    Updated {new Date(project.last_chat_update).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.key_features && project.key_features.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Key Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.key_features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary">{feature}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {project.materials_mentioned && project.materials_mentioned.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Materials Mentioned</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.materials_mentioned.map((material, idx) => (
                      <Badge key={idx} variant="outline">{material}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {project.style_preferences && project.style_preferences.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Style Preferences</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.style_preferences.map((style, idx) => (
                      <Badge key={idx} className="bg-accent">{style}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                {project.budget_estimate && (
                  <div>
                    <p className="text-sm text-muted-foreground">AI Budget Estimate</p>
                    <p className="text-lg font-semibold">${project.budget_estimate.toLocaleString()}</p>
                  </div>
                )}
                {project.timeline_weeks && (
                  <div>
                    <p className="text-sm text-muted-foreground">AI Timeline Estimate</p>
                    <p className="text-lg font-semibold">{project.timeline_weeks} weeks</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {needsOnboarding() && (
          <Card className="border-accent/50 bg-accent/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Complete Your Project Profile</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Let's chat about your project! I'll help gather important details like budget, timeline, and design preferences through a natural conversation.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    💬 Use the chat on the right (or "AI Chat" tab on mobile) to get started
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.description && (
              <div>
                <h3 className="font-semibold mb-1">Description</h3>
                <p className="text-muted-foreground">{project.description}</p>
              </div>
            )}

            {project.phase && (
              <div>
                <h3 className="font-semibold mb-1">Current Phase</h3>
                <p className="text-muted-foreground">{project.phase}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {project.budget && (
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0">
                <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
                <CardTitle className="text-lg">Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${project.budget.toLocaleString()}</p>
              </CardContent>
            </Card>
          )}

          {(project.start_date || project.end_date) && (
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0">
                <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.start_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-semibold">{new Date(project.start_date).toLocaleDateString()}</p>
                  </div>
                )}
                {project.end_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-semibold">{new Date(project.end_date).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </>
    );
  }
};

export default ProjectDetail;
