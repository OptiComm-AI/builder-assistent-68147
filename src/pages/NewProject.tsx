import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Temporary untyped alias until types regenerate
const sb = supabase as unknown as any;
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const NewProject = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const handleQuickCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      const { data, error } = await sb.from("projects").insert({
        user_id: user.id,
        name: formData.get("name") as string,
        description: formData.get("description") as string || "",
        status: "planning",
      }).select().single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project created! Let's chat about it.",
      });
      // Redirect to project detail page where chat is embedded
      if (data) {
        navigate(`/projects/${data.id}`);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>Give your project a name, and our AI will help you plan the rest through conversation</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleQuickCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input id="name" name="name" required placeholder="Kitchen Renovation" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Brief Description (Optional)</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="e.g., Kitchen renovation, Bathroom remodel, Living room redesign..." 
                  rows={3} 
                />
                <p className="text-xs text-muted-foreground">
                  Don't worry about details - our AI assistant will help you with budget, timeline, and features through conversation.
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={submitting} variant="hero" className="flex-1">
                  {submitting ? "Creating..." : "Create & Chat with AI"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                  Cancel
                </Button>
              </div>
              
              <p className="text-xs text-center text-muted-foreground pt-2">
                After creating, you'll chat with our AI to plan budget, timeline, materials, and more
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewProject;
