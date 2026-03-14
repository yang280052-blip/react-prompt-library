-- 为 prompts 表添加 images 字段（支持多图）
-- 在 Supabase Dashboard → SQL Editor 中执行此脚本

ALTER TABLE prompts
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- 验证：查看表结构
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'prompts';
