-- Safe Categories Migration for DopeTech
-- This script creates a categories table and migrates existing categories

-- Step 1: Create categories table (safe - won't conflict if exists)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Grid',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create function to update updated_at timestamp (safe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 3: Create trigger (safe - won't conflict if exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at') THEN
    CREATE TRIGGER update_categories_updated_at 
      BEFORE UPDATE ON categories 
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Step 4: Enable RLS (safe)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policy (safe - won't conflict if exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Allow all operations on categories') THEN
    CREATE POLICY "Allow all operations on categories" ON categories
      FOR ALL USING (true);
  END IF;
END $$;

-- Step 6: Grant permissions (safe)
GRANT ALL ON categories TO authenticated;
GRANT ALL ON categories TO anon;

-- Step 7: Extract existing categories from products table and insert them
INSERT INTO categories (id, name, icon, order_index) 
SELECT 
  LOWER(TRIM(category)) as id,
  INITCAP(TRIM(category)) as name,
  CASE 
    WHEN LOWER(category) LIKE '%keyboard%' THEN 'Keyboard'
    WHEN LOWER(category) LIKE '%mouse%' THEN 'Mouse'
    WHEN LOWER(category) LIKE '%audio%' OR LOWER(category) LIKE '%headphone%' THEN 'Headphones'
    WHEN LOWER(category) LIKE '%speaker%' THEN 'Speaker'
    WHEN LOWER(category) LIKE '%monitor%' THEN 'Monitor'
    WHEN LOWER(category) LIKE '%cable%' OR LOWER(category) LIKE '%accessory%' THEN 'Cable'
    ELSE 'Grid'
  END as icon,
  ROW_NUMBER() OVER (ORDER BY category) as order_index
FROM (
  SELECT DISTINCT category 
  FROM products 
  WHERE category IS NOT NULL 
  AND TRIM(category) != ''
) existing_categories
ON CONFLICT (id) DO NOTHING;

-- Step 8: Insert default "All Products" category if it doesn't exist
INSERT INTO categories (id, name, icon, order_index) 
VALUES ('all', 'All Products', 'Grid', 0)
ON CONFLICT (id) DO NOTHING;

-- Step 9: Show what was created
SELECT 'Categories table created successfully!' as status;
SELECT COUNT(*) as total_categories FROM categories;
SELECT id, name, icon FROM categories ORDER BY order_index;
