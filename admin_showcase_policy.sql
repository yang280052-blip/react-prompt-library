-- 为管理员增加案例库管理权限
-- 请在 Supabase SQL Editor 中运行此脚本

-- 1. 允许管理员管理所有案例
CREATE POLICY "管理员可以管理所有案例" ON public.showcases
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 2. 允许管理员管理所有图片对象
CREATE POLICY "管理员可以管理所有存储对象" ON storage.objects
FOR ALL
USING (
  bucket_id = 'showcase-images' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
