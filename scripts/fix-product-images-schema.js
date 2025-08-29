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

async function fixProductImagesSchema() {
  console.log('🔧 Fixing Product Images Table Schema...\n');

  try {
    // Step 1: Check current table structure
    console.log('1️⃣ Checking current table structure...');
    const { data: structure, error: structureError } = await supabase
      .from('product_images')
      .select('*')
      .limit(1);

    if (structureError) {
      console.log('❌ Error accessing product_images table:', structureError.message);
      return;
    }

    if (structure && structure.length > 0) {
      const sample = structure[0];
      console.log('📋 Current columns:');
      Object.keys(sample).forEach(key => {
        console.log(`   - ${key}: ${typeof sample[key]}`);
      });
    }

    // Step 2: Check for column inconsistencies
    console.log('\n2️⃣ Checking for column inconsistencies...');
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .limit(5);

    if (imagesError) {
      console.log('❌ Error fetching images:', imagesError.message);
      return;
    }

    console.log(`📊 Found ${images.length} sample images`);
    
    // Check which order columns exist and have data
    const orderColumns = ['display_order', 'image_order', 'sort_order'];
    const columnStatus = {};
    
    orderColumns.forEach(col => {
      const hasData = images.some(img => img[col] !== null && img[col] !== undefined);
      columnStatus[col] = hasData;
      console.log(`   - ${col}: ${hasData ? '✅ Has data' : '❌ No data'}`);
    });

    // Step 3: Fix display_order column
    console.log('\n3️⃣ Fixing display_order column...');
    
    // Update images that don't have display_order
    const { data: updateResult, error: updateError } = await supabase
      .from('product_images')
      .update({ 
        display_order: 1,
        updated_at: new Date().toISOString()
      })
      .is('display_order', null)
      .select();

    if (updateError) {
      console.log('⚠️ Error updating display_order:', updateError.message);
    } else {
      console.log(`✅ Updated ${updateResult?.length || 0} images with missing display_order`);
    }

    // Step 4: Set proper display_order for each product
    console.log('\n4️⃣ Setting proper display_order for each product...');
    
    // Get all products that have images
    const { data: productsWithImages, error: productsError } = await supabase
      .from('product_images')
      .select('product_id')
      .order('product_id');

    if (productsError) {
      console.log('❌ Error fetching products with images:', productsError.message);
      return;
    }

    const uniqueProductIds = [...new Set(productsWithImages.map(p => p.product_id))];
    console.log(`📊 Found ${uniqueProductIds.length} products with images`);

    // For each product, set proper display_order
    for (const productId of uniqueProductIds) {
      const { data: productImages, error: productImagesError } = await supabase
        .from('product_images')
        .select('id, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (productImagesError) {
        console.log(`⚠️ Error fetching images for product ${productId}:`, productImagesError.message);
        continue;
      }

      // Update display_order for each image
      for (let i = 0; i < productImages.length; i++) {
        const { error: updateOrderError } = await supabase
          .from('product_images')
          .update({ 
            display_order: i + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', productImages[i].id);

        if (updateOrderError) {
          console.log(`⚠️ Error updating order for image ${productImages[i].id}:`, updateOrderError.message);
        }
      }

      console.log(`✅ Set display_order for product ${productId} (${productImages.length} images)`);
    }

    // Step 5: Ensure primary images are set correctly
    console.log('\n5️⃣ Setting primary images...');
    
    for (const productId of uniqueProductIds) {
      // Get the first image (by display_order) for each product
      const { data: firstImage, error: firstImageError } = await supabase
        .from('product_images')
        .select('id')
        .eq('product_id', productId)
        .order('display_order', { ascending: true })
        .limit(1)
        .single();

      if (firstImageError) {
        console.log(`⚠️ Error getting first image for product ${productId}:`, firstImageError.message);
        continue;
      }

      // Set all images for this product to not primary
      const { error: clearPrimaryError } = await supabase
        .from('product_images')
        .update({ 
          is_primary: false,
          updated_at: new Date().toISOString()
        })
        .eq('product_id', productId);

      if (clearPrimaryError) {
        console.log(`⚠️ Error clearing primary for product ${productId}:`, clearPrimaryError.message);
        continue;
      }

      // Set the first image as primary
      const { error: setPrimaryError } = await supabase
        .from('product_images')
        .update({ 
          is_primary: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', firstImage.id);

      if (setPrimaryError) {
        console.log(`⚠️ Error setting primary for image ${firstImage.id}:`, setPrimaryError.message);
      } else {
        console.log(`✅ Set primary image for product ${productId}`);
      }
    }

    // Step 6: Verify the fix
    console.log('\n6️⃣ Verifying the fix...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('product_images')
      .select('id, product_id, display_order, is_primary')
      .order('product_id, display_order')
      .limit(10);

    if (finalError) {
      console.log('❌ Error in final check:', finalError.message);
      return;
    }

    console.log('📋 Final verification (first 10 images):');
    finalCheck.forEach((img, index) => {
      console.log(`   ${index + 1}. Product ${img.product_id}, Order ${img.display_order}, Primary: ${img.is_primary}`);
    });

    console.log('\n🎉 Product Images Schema Fix Completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Test adding a product with multiple images in the admin panel');
    console.log('   2. Verify that images are displayed in the correct order');
    console.log('   3. Check that primary images are set correctly');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixProductImagesSchema();
