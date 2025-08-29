-- Create categories table for DopeTech
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Grid',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (id, name, icon, order_index) VALUES
  ('all', 'All Products', 'Grid', 0),
  ('keyboard', 'Keyboards', 'Keyboard', 1),
  ('mouse', 'Mouse', 'Mouse', 2),
  ('audio', 'Audio', 'Headphones', 3),
  ('speaker', 'Speakers', 'Speaker', 4),
  ('monitor', 'Monitors', 'Monitor', 5),
  ('accessory', 'Accessories', 'Cable', 6)
ON CONFLICT (id) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON categories 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on categories" ON categories
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON categories TO authenticated;
GRANT ALL ON categories TO anon;
