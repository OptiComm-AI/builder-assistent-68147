import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, projectId } = await req.json();
    console.log('Generating BOM for project:', projectId, 'conversation:', conversationId || 'none');

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'projectId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch conversation messages if conversationId is provided
    let messages: any[] = [];
    if (conversationId) {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('role, content, image_url')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      messages = messagesData || [];
    }

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('name, description, budget, style_preferences, materials_mentioned, key_features')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    console.log('Fetched messages:', messages?.length || 0, 'project:', project?.name);

    // Create context for AI
    let conversationContext = '';
    if (messages && messages.length > 0) {
      conversationContext = messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');
    }

    const projectContext = `
Project: ${project.name}
Description: ${project.description || 'N/A'}
Budget: ${project.budget || 'Not specified'}
Style: ${project.style_preferences?.join(', ') || 'Not specified'}
Materials: ${project.materials_mentioned?.join(', ') || 'Not specified'}
Features: ${project.key_features?.join(', ') || 'Not specified'}
    `.trim();

    // Call Lovable AI to generate BOM
    const aiPrompt = `Based on the following renovation project ${conversationContext ? 'conversation and details' : 'details'}, generate a detailed Bill of Materials (BOM).

${projectContext}

${conversationContext ? `Conversation:\n${conversationContext}\n` : ''}
Generate a comprehensive BOM with items categorized by: Flooring, Cabinetry, Appliances, Lighting, Plumbing, Paint & Finishes, Hardware, and Other.

For each item provide:
- item_name: Specific product name
- description: Detailed specs
- quantity: Numeric value
- unit: sq ft, sq m, linear ft, pieces, gallons, etc.
- estimated_unit_price: Estimated cost per unit in USD
- priority: high, medium, or low
- notes: Installation notes or alternatives`;

    console.log('Calling Lovable AI for BOM generation...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a renovation expert. Generate detailed, accurate bills of materials for home renovation projects.' },
          { role: 'user', content: aiPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_bom',
            description: 'Create a bill of materials with categorized items',
            parameters: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      category: { type: 'string' },
                      item_name: { type: 'string' },
                      description: { type: 'string' },
                      quantity: { type: 'number' },
                      unit: { type: 'string' },
                      estimated_unit_price: { type: 'number' },
                      priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                      notes: { type: 'string' }
                    },
                    required: ['category', 'item_name', 'quantity', 'unit'],
                    additionalProperties: false
                  }
                }
              },
              required: ['items'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_bom' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const bomData = JSON.parse(toolCall.function.arguments);
    console.log('Parsed BOM with', bomData.items?.length, 'items');

    // Calculate total cost
    const totalCost = bomData.items.reduce((sum: number, item: any) => {
      const itemTotal = (item.quantity || 0) * (item.estimated_unit_price || 0);
      return sum + itemTotal;
    }, 0);

    // Create BOM record
    const { data: bom, error: bomError } = await supabase
      .from('bills_of_material')
      .insert({
        project_id: projectId,
        conversation_id: conversationId || null,
        total_estimated_cost: totalCost,
        status: 'draft'
      })
      .select()
      .single();

    if (bomError) throw bomError;
    console.log('BOM created:', bom.id);

    // Insert BOM items
    const bomItems = bomData.items.map((item: any) => ({
      bom_id: bom.id,
      category: item.category,
      item_name: item.item_name,
      description: item.description || null,
      quantity: item.quantity,
      unit: item.unit,
      estimated_unit_price: item.estimated_unit_price || null,
      estimated_total_price: (item.quantity || 0) * (item.estimated_unit_price || 0),
      priority: item.priority || 'medium',
      notes: item.notes || null
    }));

    const { error: itemsError } = await supabase
      .from('bom_items')
      .insert(bomItems);

    if (itemsError) throw itemsError;
    console.log('BOM items inserted:', bomItems.length);

    return new Response(
      JSON.stringify({
        success: true,
        bomId: bom.id,
        totalCost,
        itemCount: bomItems.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating BOM:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate BOM' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});