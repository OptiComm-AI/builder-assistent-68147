import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import ProjectPhases from "@/components/ProjectPhases";
import AIChat from "@/components/AIChat";
import Features from "@/components/Features";
import CTA from "@/components/CTA";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <ProjectPhases />
      <AIChat />
      <Features />
      <CTA />
    </div>
  );
};

export default Index;
