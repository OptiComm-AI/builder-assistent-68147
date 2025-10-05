import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, DollarSign, Edit, Trash2, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ProjectDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!id,
  });

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase
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

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            <Badge className={statusColors[project.status as keyof typeof statusColors]}>
              {project.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="default"
              onClick={() => navigate(`/chat?projectId=${project.id}`)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat About This Project
            </Button>
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* AI Insights Card */}
          {(project.key_features?.length || project.materials_mentioned?.length || project.style_preferences?.length || project.budget_estimate || project.timeline_weeks) && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
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
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
