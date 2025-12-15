# Integration Guide: Vendor-Organized Storage

This guide shows how to integrate the new vendor-organized storage system into existing components and workflows.

## 1. Product Upload Form Integration

### Backend - Product Creation

```javascript
// In your product creation API route
import { uploadProductMainImage } from '@/lib/storageManager';
import { getProductMainImageUrl } from '@/lib/storageManager';

export async function createProduct(req, res) {
  const { vendorId, title, slug, imageFile } = req.body;
  
  // Upload image to vendor-organized storage
  const { publicUrl } = await uploadProductMainImage(
    supabase,
    vendorId,
    slug,
    imageFile.buffer,
    imageFile.mimetype
  );

  // Create product with image URL
  const { data, error } = await supabase
    .from('products')
    .insert({
      vendor_id: vendorId,
      title,
      slug,
      image_url: publicUrl
    })
    .select();

  return { data, imageUrl: publicUrl };
}
```

### Frontend - Vue Component

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.title" placeholder="Product Title" />
    <input v-model="form.slug" placeholder="Product Slug" />
    
    <input 
      type="file" 
      ref="imageInput" 
      accept="image/*"
      @change="handleImageSelect"
    />
    <img v-if="preview" :src="preview" :alt="form.slug" />

    <button type="submit" :disabled="uploading">
      {{ uploading ? 'Uploading...' : 'Create Product' }}
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const vendorId = route.params.vendorId;

const form = ref({
  title: '',
  slug: '',
  image: null
});

const preview = ref(null);
const uploading = ref(false);

function handleImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  form.value.image = file;
  
  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    preview.value = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function handleSubmit() {
  uploading.value = true;
  
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId,
        title: form.value.title,
        slug: form.value.slug,
        imageFile: form.value.image
      })
    });

    const result = await response.json();
    console.log('Product created:', result);
    // Navigate to product or show success
  } catch (error) {
    console.error('Failed to create product:', error);
  } finally {
    uploading.value = false;
  }
}
</script>
```

---

## 2. Product Display Component

```vue
<template>
  <div class="product-card">
    <img 
      v-if="imageUrl" 
      :src="imageUrl" 
      :alt="product.title"
      class="product-image"
    />
    
    <div class="product-info">
      <h3>{{ product.title }}</h3>
      <p class="price">{{ formatPrice(product.base_price) }}</p>
      <button @click="addToCart">Add to Cart</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getProductMainImageUrl } from '@/lib/storageManager';
import { supabase } from '@/lib/customSupabaseClient';

const props = defineProps({
  product: {
    type: Object,
    required: true
  },
  vendorId: {
    type: String,
    required: true
  }
});

// Get image URL from vendor-organized storage
const imageUrl = computed(() => {
  if (props.product.image_url) {
    return props.product.image_url;
  }
  
  // Fallback to generating from storage
  return getProductMainImageUrl(
    supabase,
    props.vendorId,
    props.product.slug
  );
});

const formatPrice = (cents) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100);
};

const addToCart = () => {
  // Add to cart logic
};
</script>

<style scoped>
.product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.product-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.product-info {
  padding: 1rem;
}
</style>
```

---

## 3. Vendor Dashboard - Product Management

```vue
<template>
  <div class="vendor-products">
    <h2>My Products</h2>
    
    <div v-if="products.length === 0" class="empty-state">
      <p>No products yet. <router-link to="create">Create one</router-link></p>
    </div>

    <div v-else class="products-grid">
      <div v-for="product in products" :key="product.id" class="product-item">
        <div class="image-container">
          <img :src="getProductImage(product)" :alt="product.title" />
          <div class="actions">
            <button @click="editProduct(product)">Edit</button>
            <button @click="deleteProduct(product)">Delete</button>
          </div>
        </div>
        <h3>{{ product.title }}</h3>
        <p class="price">{{ formatPrice(product.base_price) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getProductMainImageUrl } from '@/lib/storageManager';
import { supabase } from '@/lib/customSupabaseClient';

const route = useRoute();
const vendorId = route.params.vendorId;

const products = ref([]);

onMounted(async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (!error) {
    products.value = data;
  }
});

const getProductImage = (product) => {
  return product.image_url || getProductMainImageUrl(
    supabase,
    vendorId,
    product.slug
  );
};

const editProduct = (product) => {
  // Navigate to edit page
};

const deleteProduct = async (product) => {
  if (!confirm('Are you sure?')) return;
  
  // Delete from database and storage
  await supabase.from('products').delete().eq('id', product.id);
  products.value = products.value.filter(p => p.id !== product.id);
};

const formatPrice = (cents) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100);
};
</script>

<style scoped>
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.product-item {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.product-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-container {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f5f5f5;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.2s;
}

.image-container:hover .actions {
  opacity: 1;
}

.actions button {
  background: white;
  color: #333;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

---

## 4. Batch Image Upload Utility

```javascript
// utils/batchImageUpload.js
import {
  uploadProductMainImage,
  uploadProductGalleryImage,
  uploadProductThumbnail
} from '@/lib/storageManager';

export async function uploadProductImagesFromUrls(
  supabase,
  vendorId,
  productSlug,
  imageUrls
) {
  const results = {
    main: null,
    thumbnail: null,
    gallery: []
  };

  try {
    // Download and upload first image as main
    if (imageUrls.length > 0) {
      const response = await fetch(imageUrls[0]);
      const buffer = await response.arrayBuffer();

      const { publicUrl: mainUrl } = await uploadProductMainImage(
        supabase,
        vendorId,
        productSlug,
        Buffer.from(buffer)
      );

      const { publicUrl: thumbUrl } = await uploadProductThumbnail(
        supabase,
        vendorId,
        productSlug,
        Buffer.from(buffer)
      );

      results.main = mainUrl;
      results.thumbnail = thumbUrl;
    }

    // Upload remaining images as gallery
    for (let i = 1; i < imageUrls.length; i++) {
      const response = await fetch(imageUrls[i]);
      const buffer = await response.arrayBuffer();

      const { publicUrl } = await uploadProductGalleryImage(
        supabase,
        vendorId,
        productSlug,
        i,
        Buffer.from(buffer)
      );

      results.gallery.push(publicUrl);
    }

    return results;
  } catch (error) {
    console.error('Batch upload failed:', error);
    throw error;
  }
}
```

---

## 5. Server-Side Product Update

```javascript
// pages/api/products/[id].js
import { getProductMainImageUrl } from '@/lib/storageManager';

export default async function handler(req, res) {
  const { id } = req.query;
  const { vendorId, ...updates } = req.body;

  // If only updating metadata, get existing image URL
  if (!updates.image_url) {
    const { data: product } = await supabase
      .from('products')
      .select('slug')
      .eq('id', id)
      .single();

    updates.image_url = getProductMainImageUrl(
      supabase,
      vendorId,
      product.slug
    );
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
}
```

---

## Implementation Checklist

- [ ] Import `storageManager` functions in product creation flow
- [ ] Update product forms to upload images with vendor organization
- [ ] Update product display components to use image URLs
- [ ] Test with multiple vendors
- [ ] Update product edit functionality
- [ ] Add image gallery support
- [ ] Implement image deletion on product delete
- [ ] Add image optimization options
- [ ] Monitor storage usage
- [ ] Update product search/list views

---

## Database Schema Update

Consider adding these fields to product records for better organization:

```sql
ALTER TABLE products ADD COLUMN (
  image_url TEXT,
  image_thumbnail_url TEXT,
  gallery_images TEXT[] -- Array of gallery image URLs
);

-- Index for faster queries
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
```

---

## Performance Tips

1. **Lazy load images** - Use `loading="lazy"` on `<img>` tags
2. **CDN caching** - Use image CDN for frequently accessed images
3. **Responsive images** - Serve appropriate sizes for different devices
4. **Image optimization** - Compress images on upload
5. **Caching headers** - Set cache-control on storage uploads
