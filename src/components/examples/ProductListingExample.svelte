<script>
  /**
   * ============================================================================
   * EXAMPLE: Product Listing with Data Layer
   * ============================================================================
   * 
   * Shows how to use the data layer to fetch and display products
   * Copy this pattern for any data fetching in your components
   */

  import { onMount } from 'svelte';
  import { createProductsStore, useCreateProduct } from '$lib/hooks/useDataLayer';
  import ProductCard from './ProductCard.svelte';
  import LoadingSpinner from './LoadingSpinner.svelte';
  import ErrorAlert from './ErrorAlert.svelte';

  // Initialize the store for products
  let categoryFilter = 'all';
  $: products = createProductsStore(
    categoryFilter !== 'all' ? { categoryId: categoryFilter } : {}
  );

  // Fetch products on component mount
  onMount(() => {
    products.fetch();
  });

  // Handle category filter change
  function handleFilterChange(category) {
    categoryFilter = category;
    products.fetch(); // Refetch with new filter
  }

  // Pagination
  async function loadMore() {
    const $data = $products.data;
    const nextPage = ($data?.page || 0) + 1;
    await products.fetch({ page: nextPage });
  }
</script>

<div class="products-container">
  <div class="filters">
    <button
      on:click={() => handleFilterChange('all')}
      class:active={categoryFilter === 'all'}
    >
      All Products
    </button>
    <button
      on:click={() => handleFilterChange('electronics')}
      class:active={categoryFilter === 'electronics'}
    >
      Electronics
    </button>
    <button
      on:click={() => handleFilterChange('clothing')}
      class:active={categoryFilter === 'clothing'}
    >
      Clothing
    </button>
  </div>

  {#if $products.loading && !$products.loaded}
    <LoadingSpinner />
  {:else if $products.hasError}
    <ErrorAlert message={$products.error} />
  {:else if $products.data?.products}
    <div class="products-grid">
      {#each $products.data.products as product (product.id)}
        <ProductCard {product} />
      {/each}
    </div>

    {#if $products.data.total > ($products.data.page * 24)}
      <button on:click={loadMore} disabled={$products.loading}>
        {#if $products.loading}
          Loading...
        {:else}
          Load More
        {/if}
      </button>
    {/if}
  {:else}
    <p>No products found</p>
  {/if}
</div>

<style>
  .products-container {
    padding: 2rem;
  }

  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .filters button {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    background: white;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .filters button.active {
    background: #007bff;
    color: white;
    border-color: #007bff;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
  }
</style>
