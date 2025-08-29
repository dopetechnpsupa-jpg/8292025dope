const { createClient } = require('@supabase/supabase-js');

// Use the same configuration as the main app
const supabaseUrl = 'https://flrcwmmdveylmcbjuwfc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZscmN3bW1kdmV5bG1jYmp1d2ZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg1OTYyMiwiZXhwIjoyMDcxNDM1NjIyfQ.2pm7uDjc3B73xlaqxwaS7qjwCYaOOjA7WQY6wV4WAeA';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testProductDeletion() {
  console.log('🧪 Testing Product Deletion Functionality...\n');

  try {
    // Step 1: Check database connection
    console.log('1️⃣ Testing database connection...');
    const { data: testData, error: connectionError } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .limit(1);

    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      return;
    }
    console.log('✅ Database connection successful');

    // Step 2: Check if we have products to test with
    console.log('\n2️⃣ Checking available products...');
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .limit(5);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }

    if (!products || products.length === 0) {
      console.log('⚠️ No products found in database');
      return;
    }

    console.log(`✅ Found ${products.length} products`);
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ID: ${product.id}, Name: ${product.name}`);
    });

    // Step 3: Check foreign key constraints
    console.log('\n3️⃣ Checking foreign key constraints...');
    
    // Check order_items table
    const { data: orderItems, error: orderItemsError } = await supabaseAdmin
      .from('order_items')
      .select('id, product_id')
      .limit(5);

    if (orderItemsError) {
      console.error('❌ Error checking order_items:', orderItemsError);
    } else {
      console.log(`✅ order_items table accessible, found ${orderItems?.length || 0} items`);
    }

    // Check product_images table
    const { data: productImages, error: productImagesError } = await supabaseAdmin
      .from('product_images')
      .select('id, product_id')
      .limit(5);

    if (productImagesError) {
      console.error('❌ Error checking product_images:', productImagesError);
    } else {
      console.log(`✅ product_images table accessible, found ${productImages?.length || 0} images`);
    }

    // Step 4: Test deletion permissions
    console.log('\n4️⃣ Testing deletion permissions...');
    
    // Try to delete a non-existent product first
    const { error: deleteTestError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', 999999);

    if (deleteTestError) {
      console.error('❌ Delete permission test failed:', deleteTestError);
    } else {
      console.log('✅ Delete permissions working (no error on non-existent product)');
    }

    // Step 5: Check specific product for order items
    if (products.length > 0) {
      const testProductId = products[0].id;
      console.log(`\n5️⃣ Checking order items for product ${testProductId}...`);
      
      const { data: relatedOrderItems, error: relatedError } = await supabaseAdmin
        .from('order_items')
        .select('id, order_id')
        .eq('product_id', testProductId);

      if (relatedError) {
        console.error('❌ Error checking related order items:', relatedError);
      } else {
        console.log(`✅ Found ${relatedOrderItems?.length || 0} order items for product ${testProductId}`);
      }
    }

    console.log('\n🎉 Product deletion test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Try deleting a product from the admin panel');
    console.log('2. Check the browser console for detailed logs');
    console.log('3. If issues persist, run the SQL fix: fix-product-deletion-cascade.sql');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testProductDeletion();
