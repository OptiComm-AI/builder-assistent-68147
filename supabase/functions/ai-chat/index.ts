import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Background function to extract and update project data
async function extractProjectInfoAsync(
  supabase: any,
  projectId: string,
  conversationId: string,
  messages: any[],
  apiKey: string
) {
  try {
    console.log("Starting background project data extraction for:", projectId);
    
    // Fetch all messages from this conversation
    const { data: allMessages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!allMessages || allMessages.length === 0) {
      console.log("No messages found for extraction");
      return;
    }

    // Call Lovable AI to extract structured data
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a project data extraction assistant. Extract structured project information from the conversation." 
          },
          ...allMessages,
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_project_data",
            description: "Extract structured project information from conversation",
            parameters: {
              type: "object",
              properties: {
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
      console.error("Extraction API error:", response.status);
      return;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.log("No project data extracted");
      return;
    }

    const extractedData = JSON.parse(toolCall.function.arguments);
    console.log("Extracted project data:", extractedData);

    // Update project with extracted data
    const { error } = await supabase
      .from("projects")
      .update({
        ai_extracted_data: extractedData,
        last_chat_update: new Date().toISOString(),
        budget_estimate: extractedData.budget_estimate || null,
        timeline_weeks: extractedData.timeline_weeks || null,
        key_features: extractedData.key_features || null,
        materials_mentioned: extractedData.materials_mentioned || null,
        style_preferences: extractedData.style_preferences || null,
      })
      .eq("id", projectId);

    if (error) {
      console.error("Error updating project:", error);
    } else {
      console.log("Project data updated successfully");
    }
  } catch (error) {
    console.error("Error in extractProjectInfoAsync:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, projectId, conversationId } = await req.json();
    const authHeader = req.headers.get("authorization");
    const isAuthenticated = authHeader && authHeader.startsWith("Bearer ");
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if any message contains an image
    const hasImages = messages.some((msg: any) => msg.image_url);

    // Build system prompt based on authentication status
    let systemPrompt = isAuthenticated
      ? `You are an AI Project Assistant specializing in home renovation and interior design with advanced visual analysis capabilities.

LANGUAGE POLICY:
- You are multilingual and can communicate in ANY language the user prefers
- ALWAYS respond in the SAME language the user is using
- If user switches languages, switch with them immediately
- Common languages: English, Spanish, Romanian, French, German, Italian, Portuguese, and many more
- Never tell users you only speak certain languages - you speak ALL languages

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

Always be helpful, practical, and proactive in your suggestions.`
      : `You are a friendly AI assistant helping users plan their renovation or design project.

LANGUAGE POLICY:
- You are multilingual and can communicate in ANY language the user prefers
- ALWAYS respond in the SAME language the user is using
- If user switches languages, switch with them immediately
- Never tell users you only speak certain languages - you speak ALL languages

After discussing their ideas for 3-5 messages, GENTLY suggest they create an account to save their progress and get personalized project management features. Be encouraging but not pushy.

Say something like: "I'm getting a great sense of your project! Would you like to create a free account so we can save this conversation and help you track everything?"

Be helpful first, focus on their project, and naturally suggest signup when appropriate.`;

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
- Timeline: ${project.start_date ? `${project.start_date} to ${project.end_date || "TBD"}` : "Not set"}`;

        // Add AI-extracted data if available
        if (project.ai_extracted_data) {
          const extracted = project.ai_extracted_data;
          systemPrompt += `\n\nPREVIOUSLY EXTRACTED PROJECT DETAILS:`;
          if (extracted.budget_estimate) systemPrompt += `\n- Estimated Budget: $${extracted.budget_estimate}`;
          if (extracted.timeline_weeks) systemPrompt += `\n- Estimated Timeline: ${extracted.timeline_weeks} weeks`;
          if (extracted.key_features?.length) systemPrompt += `\n- Key Features: ${extracted.key_features.join(", ")}`;
          if (extracted.materials_mentioned?.length) systemPrompt += `\n- Materials Mentioned: ${extracted.materials_mentioned.join(", ")}`;
          if (extracted.style_preferences?.length) systemPrompt += `\n- Style Preferences: ${extracted.style_preferences.join(", ")}`;
        }

        // Fetch previous conversations with summaries for this project (excluding current one)
        const { data: previousConversations } = await supabase
          .from("conversations")
          .select("id, title, summary, updated_at")
          .eq("project_id", projectId)
          .neq("id", conversationId || "")
          .order("updated_at", { ascending: false })
          .limit(3);

        if (previousConversations && previousConversations.length > 0) {
          systemPrompt += `\n\nPREVIOUS PROJECT CONVERSATIONS:`;
          for (const conv of previousConversations) {
            const date = new Date(conv.updated_at).toLocaleDateString();
            systemPrompt += `\n- [${date}] ${conv.title || "Untitled conversation"}`;
            if (conv.summary) {
              systemPrompt += `\n  Summary: ${conv.summary}`;
            }
          }
          systemPrompt += `\n\nNote: These conversation summaries provide context about this project. Build upon previous discussions and avoid repeating what's already been covered.`;
        }

        systemPrompt += `\n\nProvide guidance specific to this project's phase and context. Reference the project details when relevant.`;
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

    // Trigger project data extraction asynchronously (don't wait)
    if (projectId && conversationId) {
      // Clone the response body so we can both stream it and read it
      const [stream1, stream2] = response.body!.tee();
      
      // Extract project info in the background
      extractProjectInfoAsync(
        supabase,
        projectId,
        conversationId,
        messages,
        LOVABLE_API_KEY
      ).catch(err => console.error("Background extraction error:", err));

      return new Response(stream1, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
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