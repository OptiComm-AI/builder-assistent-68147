-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create vendors table
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  search_url_template TEXT NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(name)
);

-- Enable RLS
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendors
CREATE POLICY "Admins can manage vendors"
  ON public.vendors FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view active vendors"
  ON public.vendors FOR SELECT
  USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER handle_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create admin analytics view
CREATE OR REPLACE VIEW public.admin_user_stats AS
SELECT 
  p.id,
  p.full_name,
  p.username,
  p.created_at,
  COUNT(DISTINCT pr.id) as project_count,
  COUNT(DISTINCT c.id) as conversation_count,
  COUNT(DISTINCT m.id) as message_count,
  MAX(m.created_at) as last_activity,
  COALESCE(SUM(pr.budget), 0) as total_budget
FROM profiles p
LEFT JOIN projects pr ON p.id = pr.user_id
LEFT JOIN conversations c ON p.id = c.user_id
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY p.id, p.full_name, p.username, p.created_at;

-- Insert default vendors
INSERT INTO public.vendors (name, website_url, search_url_template, priority) VALUES
  ('Home Depot', 'https://www.homedepot.com', 'https://www.homedepot.com/s/{query}', 3),
  ('Lowes', 'https://www.lowes.com', 'https://www.lowes.com/search?searchTerm={query}', 2),
  ('Amazon', 'https://www.amazon.com', 'https://www.amazon.com/s?k={query}', 1);