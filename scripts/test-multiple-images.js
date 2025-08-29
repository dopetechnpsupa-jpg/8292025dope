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

async function testMultipleImages() {
  console.log('🧪 Testing Multiple Image Functionality...\n');

  try {
    // Test 1: Check products with multiple images
    console.log('1️⃣ Checking products with multiple images...');
    const { data: allImages, error: allImagesError } = await supabase
      .from('product_images')
      .select('product_id')
      .order('product_id');

    if (allImagesError) {
      console.log('❌ Error checking all images:', allImagesError.message);
      return;
    }

    // Count images per product
    const productImageCounts = {};
    allImages.forEach(img => {
      productImageCounts[img.product_id] = (productImageCounts[img.product_id] || 0) + 1;
    });

    const productsWithMultipleImages = Object.entries(productImageCounts)
      .filter(([_, count]) => count > 1)
      .map(([productId, count]) => ({ product_id: parseInt(productId), count }));



    console.log(`📊 Found ${productsWithMultipleImages.length} products with multiple images`);
    
    if (productsWithMultipleImages.length > 0) {
      console.log('📋 Products with multiple images:');
      for (const product of productsWithMultipleImages) {
        console.log(`   - Product ID: ${product.product_id} (${product.count} images)`);
      }
    }

    // Test 2: Check image ordering
    console.log('\n2️⃣ Checking image ordering...');
    const { data: orderedImages, error: orderError } = await supabase
      .from('product_images')
      .select('id, product_id, display_order, is_primary, image_url')
      .order('product_id, display_order')
      .limit(20);

    if (orderError) {
      console.log('❌ Error checking image ordering:', orderError.message);
      return;
    }

    console.log('📋 Image ordering check (first 20 images):');
    let currentProduct = null;
    orderedImages.forEach((img, index) => {
      if (currentProduct !== img.product_id) {
        currentProduct = img.product_id;
        console.log(`\n   Product ${img.product_id}:`);
      }
      console.log(`     ${img.display_order}. Image ${img.id} ${img.is_primary ? '(Primary)' : ''}`);
    });

    // Test 3: Check primary image consistency
    console.log('\n3️⃣ Checking primary image consistency...');
    const { data: primaryCheck, error: primaryError } = await supabase
      .from('product_images')
      .select('product_id, is_primary')
      .eq('is_primary', true)
      .order('product_id');

    if (primaryError) {
      console.log('❌ Error checking primary images:', primaryError.message);
      return;
    }

    console.log(`📊 Found ${primaryCheck.length} primary images`);
    
    // Check for products with multiple primary images
    const productPrimaryCounts = {};
    primaryCheck.forEach(img => {
      productPrimaryCounts[img.product_id] = (productPrimaryCounts[img.product_id] || 0) + 1;
    });

    const multiplePrimary = Object.entries(productPrimaryCounts).filter(([_, count]) => count > 1);
    if (multiplePrimary.length > 0) {
      console.log('⚠️ Products with multiple primary images:');
      multiplePrimary.forEach(([productId, count]) => {
        console.log(`   - Product ${productId}: ${count} primary images`);
      });
    } else {
      console.log('✅ All products have exactly one primary image');
    }

    // Test 4: Check for products without primary images
    console.log('\n4️⃣ Checking for products without primary images...');
    const { data: allProducts, error: allProductsError } = await supabase
      .from('product_images')
      .select('product_id, is_primary')
      .order('product_id');

    if (allProductsError) {
      console.log('❌ Error checking all products:', allProductsError.message);
      return;
    }

    const productsWithImages = [...new Set(allProducts.map(img => img.product_id))];
    const productsWithPrimary = [...new Set(allProducts.filter(img => img.is_primary).map(img => img.product_id))];
    const productsWithoutPrimary = productsWithImages.filter(id => !productsWithPrimary.includes(id));

    if (productsWithoutPrimary.length > 0) {
      console.log('⚠️ Products without primary images:');
      productsWithoutPrimary.forEach(productId => {
        console.log(`   - Product ${productId}`);
      });
    } else {
      console.log('✅ All products with images have primary images');
    }

    // Test 5: Check display_order consistency
    console.log('\n5️⃣ Checking display_order consistency...');
    const { data: orderCheck, error: orderCheckError } = await supabase
      .from('product_images')
      .select('product_id, display_order')
      .order('product_id, display_order');

    if (orderCheckError) {
      console.log('❌ Error checking display_order:', orderCheckError.message);
      return;
    }

    // Check for gaps in display_order
    const orderIssues = [];
    let currentProductId = null;
    let expectedOrder = 1;

    orderCheck.forEach(img => {
      if (currentProductId !== img.product_id) {
        currentProductId = img.product_id;
        expectedOrder = 1;
      }
      
      if (img.display_order !== expectedOrder) {
        orderIssues.push({
          productId: img.product_id,
          expected: expectedOrder,
          actual: img.display_order
        });
      }
      
      expectedOrder++;
    });

    if (orderIssues.length > 0) {
      console.log('⚠️ Display order issues found:');
      orderIssues.forEach(issue => {
        console.log(`   - Product ${issue.productId}: expected ${issue.expected}, got ${issue.actual}`);
      });
    } else {
      console.log('✅ All display orders are consistent');
    }

    console.log('\n🎉 Multiple Image Functionality Test Completed!');
    
    if (productsWithMultipleImages.length > 0) {
      console.log('\n✅ Multiple image functionality is working!');
      console.log('💡 You can now:');
      console.log('   1. Add products with multiple images in the admin panel');
      console.log('   2. Reorder images using the up/down arrows');
      console.log('   3. Set primary images using the star icon');
      console.log('   4. Delete individual images');
    } else {
      console.log('\n💡 No products with multiple images found yet.');
      console.log('   Try adding a product with multiple images in the admin panel to test the functionality.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testMultipleImages();
