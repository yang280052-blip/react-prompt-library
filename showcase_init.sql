-- 优秀案例库 (Showcases) 数据库及存储初始化脚本

-- 1. 创建 showcases 表
CREATE TABLE IF NOT EXISTS public.showcases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    prompt_content TEXT NOT NULL,
    image_url TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 启用行级安全 (RLS)
ALTER TABLE public.showcases ENABLE ROW LEVEL SECURITY;

-- 3. 创建 RLS 策略
DROP POLICY IF EXISTS "公开案例对所有人可见" ON public.showcases;
CREATE POLICY "公开案例对所有人可见" 
ON public.showcases FOR SELECT 
USING (is_public = true);

DROP POLICY IF EXISTS "用户可以管理自己的案例" ON public.showcases;
CREATE POLICY "用户可以管理自己的案例" 
ON public.showcases FOR ALL 
USING (auth.uid() = user_id);

-- 4. 自动化设置存储桶 (Storage)
-- 如果存储桶不存在则创建
INSERT INTO storage.buckets (id, name, public)
VALUES ('showcase-images', 'showcase-images', true)
ON CONFLICT (id) DO NOTHING;

-- 5. 设置存储桶权限 (Storage Policies)

-- 允许公开读取图片
DROP POLICY IF EXISTS "公开读取图片" ON storage.objects;
CREATE POLICY "公开读取图片"
ON storage.objects FOR SELECT
USING (bucket_id = 'showcase-images');

-- 允许登录用户上传图片
DROP POLICY IF EXISTS "允许登录用户上传图片" ON storage.objects;
CREATE POLICY "允许登录用户上传图片"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'showcase-images' 
    AND auth.role() = 'authenticated'
);

-- 允许用户管理自己的图片 (更新和删除)
DROP POLICY IF EXISTS "允许用户管理自己的图片" ON storage.objects;
CREATE POLICY "允许用户管理自己的图片"
ON storage.objects FOR ALL
USING (
    bucket_id = 'showcase-images' 
    AND auth.uid() = owner
);
