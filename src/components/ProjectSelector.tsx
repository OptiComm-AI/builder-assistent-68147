import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FolderKanban } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId?: string;
  onProjectSelect: (projectId: string) => void;
  disabled?: boolean;
}

const ProjectSelector = ({ 
  projects, 
  selectedProjectId, 
  onProjectSelect,
  disabled 
}: ProjectSelectorProps) => {
  return (
    <div className="mb-4 bg-muted/30 p-4 rounded-lg border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <FolderKanban className="w-4 h-4 text-muted-foreground" />
        <label className="text-sm font-medium">Link to Project</label>
      </div>
      <Select
        value={selectedProjectId || "new"}
        onValueChange={onProjectSelect}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a project or create new" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">+ Create New Project</SelectItem>
          <Separator className="my-2" />
          {projects.map(project => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProjectSelector;
