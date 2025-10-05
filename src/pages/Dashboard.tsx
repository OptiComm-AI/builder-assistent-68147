import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Temporary untyped alias until types regenerate
const sb = supabase as unknown as any;
import { Badge } from "@/components/ui/badge";
import { Plus, FolderKanban, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      const { data, error } = await sb
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const stats = {
    total: projects?.length || 0,
    planning: projects?.filter(p => p.status === "planning").length || 0,
    inProgress: projects?.filter(p => p.status === "in_progress").length || 0,
    completed: projects?.filter(p => p.status === "completed").length || 0,
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button onClick={() => navigate("/")}>Back to Home</Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">Here's an overview of your projects</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planning</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.planning}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold">Your Projects</h3>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/chat")}>
              <MessageSquare className="mr-2 h-4 w-4" />
              AI Chat
            </Button>
            <Button onClick={() => navigate("/projects/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p>Loading projects...</p>
        ) : projects && projects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/projects/${project.id}`)}>
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>{project.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* AI Insights Section */}
                  {project.key_features && project.key_features.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-1">Key Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {project.key_features.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {project.key_features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.key_features.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="capitalize">{project.status?.replace("_", " ") || "planning"}</span>
                    {project.budget && <span>${project.budget.toLocaleString()}</span>}
                  </div>
                  
                  {/* Budget estimate from AI */}
                  {project.budget_estimate && !project.budget && (
                    <div className="text-xs text-muted-foreground mb-2">
                      Est. Budget: ${project.budget_estimate.toLocaleString()}
                    </div>
                  )}
                  
                  {/* Timeline estimate */}
                  {project.timeline_weeks && (
                    <div className="text-xs text-muted-foreground mb-2">
                      Est. Timeline: {project.timeline_weeks} weeks
                    </div>
                  )}
                  
                  {/* Last chat indicator */}
                  {project.last_chat_update && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Last discussed {formatDistanceToNow(new Date(project.last_chat_update), { addSuffix: true })}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first project</p>
              <Button onClick={() => navigate("/projects/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
