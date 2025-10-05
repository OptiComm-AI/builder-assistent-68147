-- Grant admin role to cristi@relami.com
INSERT INTO public.user_roles (user_id, role) 
VALUES ('778d75fc-615a-45f6-a9fb-887e42748c28', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;