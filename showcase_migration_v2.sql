-- 优秀案例库 V2 迁移脚本
-- 支持单案例多图片并增加注释功能

-- 1. 为 showcases 表增加 images JSONB 字段
ALTER TABLE public.showcases ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- 2. (可选) 将原有的单图数据迁移到新数组中
UPDATE public.showcases 
SET images = jsonb_build_array(jsonb_build_object('url', image_url, 'caption', ''))
WHERE image_url IS NOT NULL AND (images IS NULL OR jsonb_array_length(images) = 0);

-- 3. 说明：
-- 新的数据结构为：
-- images = [
--   {"url": "...", "caption": "..."},
--   {"url": "...", "caption": "..."}
-- ]
