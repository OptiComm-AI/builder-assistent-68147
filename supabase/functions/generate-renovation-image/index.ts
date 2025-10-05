import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { originalImageUrl, transformationRequest, projectContext, styleDetails } = await req.json();

    console.log('Generate renovation image request:', {
      hasImage: !!originalImageUrl,
      mode: originalImageUrl ? 'transformation' : 'text-to-image',
      requestLength: transformationRequest?.length,
      hasContext: !!projectContext,
      hasStyleDetails: !!styleDetails
    });

    if (!transformationRequest) {
      return new Response(
        JSON.stringify({ error: 'Missing transformation request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let aiPayload: any;
    let prompt: string;

    // TEXT-TO-IMAGE MODE: Generate from description only (no input image)
    if (!originalImageUrl) {
      console.log('TEXT-TO-IMAGE MODE: Generating from description');
      
      // Build detailed prompt for text-to-image generation
      const contextInfo = projectContext 
        ? `Project: ${projectContext.name}. Budget: $${projectContext.budget || 'flexible'}. Style: ${projectContext.style_preferences?.join(', ') || 'modern'}.`
        : '';
      
      const styleInfo = styleDetails 
        ? `Space Type: ${styleDetails.spaceType || 'interior'}. Style: ${styleDetails.style || 'modern'}. Colors: ${styleDetails.colors?.join(', ') || 'neutral'}. Features: ${styleDetails.features?.join(', ') || 'functional'}.`
        : '';
      
      prompt = `Create a highly realistic, professional interior design rendering.

${transformationRequest}

${contextInfo}
${styleInfo}

Requirements:
- Photorealistic quality with accurate lighting and shadows
- High attention to materials, textures, and finishes  
- Practical and achievable design (not fantasy)
- Professional architectural visualization style
- Show realistic furniture placement and decor
- Include ambient and task lighting
- Modern, clean aesthetic
- Natural color palette that's inviting and livable

The image should look like it was photographed by a professional interior photographer in a completed, staged space.`;

      aiPayload = {
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text']
      };

      console.log('Text-to-image prompt prepared');
    } else {
      // IMAGE-TO-IMAGE MODE: Transform existing image
      console.log('IMAGE-TO-IMAGE MODE: Transforming uploaded image');
      
      // Fetch the original image and convert to base64
    console.log('Fetching original image from:', originalImageUrl.substring(0, 100));
    const imageResponse = await fetch(originalImageUrl);
    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch original image' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const base64DataUrl = `data:${mimeType};base64,${base64Image}`;

      console.log('Image converted to base64, size:', base64Image.length);

      // Build transformation prompt with context
      const contextInfo = projectContext 
        ? `Project: ${projectContext.name}. Budget: $${projectContext.budget || 'flexible'}. Style: ${projectContext.style_preferences?.join(', ') || 'modern'}.`
        : '';
      
      prompt = `${transformationRequest}

${contextInfo}

Create a realistic renovation transformation that shows:
- High-quality, professional interior design
- Realistic materials and lighting
- Practical and achievable renovation
- Modern, clean aesthetic
- Attention to detail and craftsmanship

Maintain the room layout and architectural features while transforming the style, materials, and finishes.`;

      aiPayload = {
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: base64DataUrl } }
            ]
          }
        ],
        modalities: ['image', 'text']
      };
    }

    console.log('Calling Lovable AI Gateway for image generation...');

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiPayload),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    // Extract generated image from response
    const generatedImageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!generatedImageBase64) {
      console.error('No image in AI response. Response structure:', {
        hasChoices: !!aiData.choices,
        choicesLength: aiData.choices?.length,
        hasMessage: !!aiData.choices?.[0]?.message,
        hasImages: !!aiData.choices?.[0]?.message?.images,
        imagesLength: aiData.choices?.[0]?.message?.images?.length,
        messageContent: aiData.choices?.[0]?.message?.content?.substring(0, 100)
      });
      return new Response(
        JSON.stringify({ error: 'No image generated by AI model' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract base64 data (remove data URL prefix if present)
    const base64Data = generatedImageBase64.replace(/^data:image\/\w+;base64,/, '');
    
    // Convert base64 to blob for upload
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/png' });

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const fileName = `generated_${Date.now()}_${Math.random().toString(36).substring(2)}.png`;
    console.log('Uploading generated image:', fileName);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(fileName, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to save generated image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('chat-images')
      .createSignedUrl(uploadData.path, 3600);

    if (signedUrlError || !signedUrlData) {
      console.error('Signed URL error:', signedUrlError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate image URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Image transformation complete');

    return new Response(
      JSON.stringify({ 
        generatedImageUrl: signedUrlData.signedUrl,
        originalImageUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-renovation-image:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
