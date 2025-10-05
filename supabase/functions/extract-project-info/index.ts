import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Extracting project info from messages:", messages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a project data extraction assistant. Extract structured project information from the conversation." 
          },
          ...messages,
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_project_data",
            description: "Extract structured project information from conversation",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Project name/title" },
                description: { type: "string", description: "Detailed description" },
                budget_estimate: { type: "number", description: "Estimated budget in USD" },
                timeline_weeks: { type: "number", description: "Estimated timeline in weeks" },
                key_features: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Key features/requirements mentioned"
                },
                materials_mentioned: {
                  type: "array",
                  items: { type: "string" },
                  description: "Materials or products discussed"
                },
                style_preferences: {
                  type: "array",
                  items: { type: "string" },
                  description: "Design styles mentioned (modern, rustic, etc.)"
                }
              }
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_project_data" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to extract project data" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));

    // Extract tool call arguments
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "No project data extracted" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const projectData = JSON.parse(toolCall.function.arguments);
    console.log("Extracted project data:", projectData);

    return new Response(
      JSON.stringify({ projectData }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("extract-project-info error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
