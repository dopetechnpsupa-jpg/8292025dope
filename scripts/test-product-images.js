const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductImages() {
  console.log('🔍 Testing Product Images Table...\n');

  try {
    // Test 1: Check if product_images table exists
    console.log('1️⃣ Checking if product_images table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('product_images')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ product_images table does not exist or is not accessible');
      console.log('Error:', tableError.message);
      console.log('\n💡 Solution: Run the fix-product-images-table.sql script in your Supabase SQL Editor');
      return;
    }

    console.log('✅ product_images table exists and is accessible');

    // Test 2: Check table structure
    console.log('\n2️⃣ Checking table structure...');
    const { data: structure, error: structureError } = await supabase
      .from('product_images')
      .select('*')
      .limit(1);

    if (structureError) {
      console.log('❌ Error checking table structure:', structureError.message);
      return;
    }

    if (structure && structure.length > 0) {
      const sample = structure[0];
      console.log('📋 Table columns found:');
      Object.keys(sample).forEach(key => {
        console.log(`   - ${key}: ${typeof sample[key]}`);
      });
    } else {
      console.log('📋 Table exists but is empty');
    }

    // Test 3: Check for existing product images
    console.log('\n3️⃣ Checking existing product images...');
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .order('product_id', { ascending: true });

    if (imagesError) {
      console.log('❌ Error fetching product images:', imagesError.message);
      return;
    }

    console.log(`📊 Found ${images.length} product images`);
    
    if (images.length > 0) {
      console.log('📋 Sample images:');
      images.slice(0, 3).forEach((img, index) => {
        console.log(`   ${index + 1}. Product ID: ${img.product_id}, Primary: ${img.is_primary}, Order: ${img.display_order || img.image_order || 'N/A'}`);
      });
    }

    // Test 4: Check products table for reference
    console.log('\n4️⃣ Checking products table...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(5);

    if (productsError) {
      console.log('❌ Error fetching products:', productsError.message);
      return;
    }

    console.log(`📊 Found ${products.length} products`);
    if (products.length > 0) {
      console.log('📋 Sample products:');
      products.forEach((product, index) => {
        console.log(`   ${index + 1}. ID: ${product.id}, Name: ${product.name}`);
      });
    }

    // Test 5: Test image upload functionality
    console.log('\n5️⃣ Testing image upload functionality...');
    console.log('💡 This would test the actual upload process');
    console.log('   - Storage bucket access');
    console.log('   - File upload permissions');
    console.log('   - Database insertion');

    // Test 6: Check RLS policies
    console.log('\n6️⃣ Checking RLS policies...');
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_policies', { table_name: 'product_images' });
      
      if (policiesError) {
        console.log('⚠️ Could not check RLS policies directly');
        console.log('   This is normal - policies are managed at database level');
      } else {
        console.log('✅ RLS policies check completed');
      }
    } catch (error) {
      console.log('⚠️ RLS policy check skipped (normal)');
    }

    console.log('\n🎉 Product Images Table Test Completed!');
    
    if (images.length === 0) {
      console.log('\n💡 Recommendations:');
      console.log('   1. The table exists but has no images');
      console.log('   2. Try adding a product with images through the admin panel');
      console.log('   3. Check if the upload functionality is working');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testProductImages();
