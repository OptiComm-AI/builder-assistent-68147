import { Lightbulb, ClipboardList, ShoppingCart, Wrench } from "lucide-react";

const phases = [
  {
    icon: Lightbulb,
    title: "Inspiration & Design",
    description: "Upload photos of your space. Get AI-generated design concepts in seconds. Refine with natural conversation.",
    color: "primary",
  },
  {
    icon: ClipboardList,
    title: "Planning & Budgeting",
    description: "Automatic bill of materials. Smart quantity estimates. Real-time pricing with budget alternatives.",
    color: "secondary",
  },
  {
    icon: ShoppingCart,
    title: "Procurement",
    description: "One-click project cart. Multi-seller optimization. Professional contractor matching when needed.",
    color: "accent",
  },
  {
    icon: Wrench,
    title: "Execution & Support",
    description: "Step-by-step guidance. Visual troubleshooting. Expert help exactly when you need it.",
    color: "primary",
  },
];

const ProjectPhases = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Four Phases to
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Project Success</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our AI assistant guides you through every stage, from initial idea to finished masterpiece.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            const gradientClass = phase.color === "primary" ? "gradient-hero" : 
                                 phase.color === "secondary" ? "bg-secondary" : 
                                 "gradient-accent";
            
            return (
              <div 
                key={index}
                className="group relative bg-card p-8 rounded-2xl border border-border/50 hover:border-border transition-smooth hover:shadow-elegant"
              >
                {/* Number indicator */}
                <div className="absolute -top-4 -right-4 w-12 h-12 gradient-hero rounded-full flex items-center justify-center text-primary-foreground font-bold shadow-elegant">
                  {index + 1}
                </div>
                
                <div className={`w-16 h-16 ${gradientClass} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-smooth shadow-elegant`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-3">{phase.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{phase.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProjectPhases;
