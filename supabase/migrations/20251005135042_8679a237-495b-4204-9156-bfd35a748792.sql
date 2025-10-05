-- Create bills_of_material table
CREATE TABLE public.bills_of_material (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  total_estimated_cost NUMERIC,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create bom_items table
CREATE TABLE public.bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES public.bills_of_material(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT,
  estimated_unit_price NUMERIC,
  estimated_total_price NUMERIC,
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create product_matches table
CREATE TABLE public.product_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_item_id UUID NOT NULL REFERENCES public.bom_items(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_url TEXT NOT NULL,
  price NUMERIC,
  vendor TEXT NOT NULL,
  in_stock BOOLEAN,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  product_details JSONB,
  match_score NUMERIC,
  is_selected BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.bills_of_material ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bills_of_material
CREATE POLICY "Users can view BOMs for their own projects"
  ON public.bills_of_material FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = bills_of_material.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create BOMs for their own projects"
  ON public.bills_of_material FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = bills_of_material.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own BOMs"
  ON public.bills_of_material FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = bills_of_material.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own BOMs"
  ON public.bills_of_material FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = bills_of_material.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for bom_items
CREATE POLICY "Users can view BOM items for their own projects"
  ON public.bom_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bills_of_material bom
      JOIN public.projects p ON bom.project_id = p.id
      WHERE bom.id = bom_items.bom_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create BOM items for their own projects"
  ON public.bom_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bills_of_material bom
      JOIN public.projects p ON bom.project_id = p.id
      WHERE bom.id = bom_items.bom_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own BOM items"
  ON public.bom_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bills_of_material bom
      JOIN public.projects p ON bom.project_id = p.id
      WHERE bom.id = bom_items.bom_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own BOM items"
  ON public.bom_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.bills_of_material bom
      JOIN public.projects p ON bom.project_id = p.id
      WHERE bom.id = bom_items.bom_id
      AND p.user_id = auth.uid()
    )
  );

-- RLS Policies for product_matches
CREATE POLICY "Users can view product matches for their own projects"
  ON public.product_matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bom_items bi
      JOIN public.bills_of_material bom ON bi.bom_id = bom.id
      JOIN public.projects p ON bom.project_id = p.id
      WHERE bi.id = product_matches.bom_item_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create product matches for their own projects"
  ON public.product_matches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bom_items bi
      JOIN public.bills_of_material bom ON bi.bom_id = bom.id
      JOIN public.projects p ON bom.project_id = p.id
      WHERE bi.id = product_matches.bom_item_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own product matches"
  ON public.product_matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bom_items bi
      JOIN public.bills_of_material bom ON bi.bom_id = bom.id
      JOIN public.projects p ON bom.project_id = p.id
      WHERE bi.id = product_matches.bom_item_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own product matches"
  ON public.product_matches FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.bom_items bi
      JOIN public.bills_of_material bom ON bi.bom_id = bom.id
      JOIN public.projects p ON bom.project_id = p.id
      WHERE bi.id = product_matches.bom_item_id
      AND p.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_bom_project_id ON public.bills_of_material(project_id);
CREATE INDEX idx_bom_items_bom_id ON public.bom_items(bom_id);
CREATE INDEX idx_product_matches_bom_item_id ON public.product_matches(bom_item_id);

-- Add trigger for updated_at on bills_of_material
CREATE TRIGGER update_bills_of_material_updated_at
  BEFORE UPDATE ON public.bills_of_material
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();