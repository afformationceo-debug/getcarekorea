import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Try .env.local first, then .env
const envPath = path.resolve(process.cwd(), '.env.local');
const envPathAlt = path.resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envPath });
if (result.error) {
  dotenv.config({ path: envPathAlt });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBlogImagesBucket() {
  console.log('🪣 Checking blog-images bucket...');

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('❌ Error listing buckets:', listError);
    return;
  }

  const bucketExists = buckets?.some(b => b.name === 'blog-images');

  if (bucketExists) {
    console.log('✅ blog-images bucket already exists!');
    return;
  }

  console.log('📦 Creating blog-images bucket...');

  // Create bucket
  const { data, error } = await supabase.storage.createBucket('blog-images', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  });

  if (error) {
    console.error('❌ Error creating bucket:', error);
    return;
  }

  console.log('✅ blog-images bucket created successfully!');
  console.log('📁 Bucket ID:', data);
}

createBlogImagesBucket().catch(console.error);
