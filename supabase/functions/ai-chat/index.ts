import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, projectId, conversationId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if any message contains an image
    const hasImages = messages.some((msg: any) => msg.image_url);

    // Build system prompt with vision capabilities
    let systemPrompt = `You are an AI Project Assistant specializing in home renovation and interior design with advanced visual analysis capabilities.

Your capabilities:
${hasImages ? `
**Visual Analysis** - When analyzing images:
- Describe room layouts, dimensions, and spatial relationships
- Identify current conditions, materials, and finishes
- Analyze design elements, styles, and existing features
- Assess natural and artificial lighting
- Detect potential issues (damage, structural concerns, poor layouts)
- Suggest specific improvements based on what you see
- Recommend materials, colors, and finishes that complement the space
- Provide actionable renovation/design suggestions
` : ''}
- Provide budget advice and timeline suggestions
- Recommend materials, styles, and layouts
- Help track project progress and milestones
- Identify potential issues and suggest solutions
- Answer questions about design, construction, and project management

Always be helpful, practical, and proactive in your suggestions.`;

    if (projectId) {
      const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (project) {
        systemPrompt += `\n\nCURRENT PROJECT CONTEXT:
- Project Name: ${project.name}
- Description: ${project.description || "Not provided"}
- Current Phase: ${project.phase || "Planning"}
- Status: ${project.status}
- Budget: ${project.budget ? `$${project.budget}` : "Not set"}
- Timeline: ${project.start_date ? `${project.start_date} to ${project.end_date || "TBD"}` : "Not set"}

Provide guidance specific to this project's phase and context. Reference the project details when relevant.`;
      }
    }

    // Format messages for multimodal (text + images)
    const formattedMessages = messages.map((msg: any) => {
      if (msg.image_url) {
        return {
          role: msg.role,
          content: [
            { type: "text", text: msg.content },
            { type: "image_url", image_url: { url: msg.image_url } }
          ]
        };
      }
      return msg;
    });

    // Use gemini-2.5-pro for vision, flash for text-only
    const model = hasImages ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";

    console.log("Calling Lovable AI with model:", model, "messages:", messages.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...formattedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "Payment required, please add funds to your Lovable AI workspace." 
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("chat error:", error);
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