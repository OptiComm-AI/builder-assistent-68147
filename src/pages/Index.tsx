import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import ProjectPhases from "@/components/ProjectPhases";
import Features from "@/components/Features";
import CTA from "@/components/CTA";
import AIChat from "@/components/AIChat";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <ProjectPhases />
      <Features />
      
      {/* Homepage AI Chat Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Start Planning Your Project</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Chat with our AI assistant to explore ideas and get personalized advice. 
              Sign up to save your conversation and track your project progress.
            </p>
          </div>
          <div className="max-w-5xl mx-auto h-[600px]">
            <AIChat mode="homepage" />
          </div>
        </div>
      </section>
      
      <CTA />
    </div>
  );
};

export default Index;
