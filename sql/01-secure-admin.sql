-- Executar somente após validar que o projeto Supabase selecionado é o correto.
-- Remove bootstrap automático inseguro que pode promover o primeiro cadastro público a admin.
BEGIN;
DROP TRIGGER IF EXISTS on_auth_user_created_bootstrap ON auth.users;
DROP FUNCTION IF EXISTS public.bootstrap_first_admin();
COMMIT;

-- O proprietário deve criar usuário no Supabase Auth e atribuir role admin
-- APENAS por acesso administrativo (SQL Editor) com o UUID verificado:
-- SELECT id,email FROM auth.users ORDER BY created_at ASC;
-- INSERT INTO public.user_roles(user_id,role)
-- VALUES ('UUID_VERIFICADO_DO_PROPRIETARIO'::uuid, 'admin'::public.app_role)
-- ON CONFLICT (user_id,role) DO NOTHING;
-- Nunca atribua admin automaticamente a todo cadastro público.
