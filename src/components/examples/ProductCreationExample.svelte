<script>
  /**
   * ============================================================================
   * EXAMPLE: Product Creation Form with Data Layer
   * ============================================================================
   * 
   * Shows how to use the data layer for form submissions and data creation
   */

  import { useCreateProduct } from '$lib/hooks/useDataLayer';
  import { VALIDATION_RULES } from '$lib/config/dataLayerConfig.js';

  let formData = {
    title: '',
    description: '',
    base_price: '',
    category_id: 'electronics',
    inventory_quantity: 0
  };

  let formErrors = {};
  const { create, loading } = useCreateProduct();

  /**
   * Validate form data locally before submission
   */
  function validateForm() {
    formErrors = {};
    const rules = VALIDATION_RULES.product;

    if (!formData.title || formData.title.length < rules.title.min) {
      formErrors.title = `Title must be at least ${rules.title.min} characters`;
    }

    if (formData.title.length > rules.title.max) {
      formErrors.title = `Title cannot exceed ${rules.title.max} characters`;
    }

    if (!formData.description || formData.description.length < rules.description.min) {
      formErrors.description = `Description must be at least ${rules.description.min} characters`;
    }

    if (Number(formData.base_price) < rules.base_price.min) {
      formErrors.base_price = `Price must be at least $${rules.base_price.min}`;
    }

    if (Number(formData.inventory_quantity) < rules.inventory_quantity.min) {
      formErrors.inventory_quantity = 'Quantity must be at least 0';
    }

    return Object.keys(formErrors).length === 0;
  }

  /**
   * Handle form submission
   */
  async function handleSubmit(e) {
    e.preventDefault();

    // Validate
    if (!validateForm()) {
      return; // Show errors
    }

    // Submit via data layer
    const result = await create({
      ...formData,
      base_price: Number(formData.base_price),
      inventory_quantity: Number(formData.inventory_quantity)
    });

    // Data layer handles success notification automatically
    if (result.success) {
      // Reset form
      formData = {
        title: '',
        description: '',
        base_price: '',
        category_id: 'electronics',
        inventory_quantity: 0
      };
      formErrors = {};
    }
  }
</script>

<form on:submit={handleSubmit}>
  <div class="form-group">
    <label for="title">Product Title</label>
    <input
      id="title"
      type="text"
      bind:value={formData.title}
      placeholder="Enter product title"
      disabled={$loading}
    />
    {#if formErrors.title}
      <span class="error">{formErrors.title}</span>
    {/if}
  </div>

  <div class="form-group">
    <label for="description">Description</label>
    <textarea
      id="description"
      bind:value={formData.description}
      placeholder="Describe your product"
      rows="5"
      disabled={$loading}
    />
    {#if formErrors.description}
      <span class="error">{formErrors.description}</span>
    {/if}
  </div>

  <div class="form-row">
    <div class="form-group">
      <label for="price">Price</label>
      <input
        id="price"
        type="number"
        bind:value={formData.base_price}
        placeholder="0.00"
        step="0.01"
        disabled={$loading}
      />
      {#if formErrors.base_price}
        <span class="error">{formErrors.base_price}</span>
      {/if}
    </div>

    <div class="form-group">
      <label for="quantity">Inventory</label>
      <input
        id="quantity"
        type="number"
        bind:value={formData.inventory_quantity}
        placeholder="0"
        disabled={$loading}
      />
      {#if formErrors.inventory_quantity}
        <span class="error">{formErrors.inventory_quantity}</span>
      {/if}
    </div>

    <div class="form-group">
      <label for="category">Category</label>
      <select bind:value={formData.category_id} disabled={$loading}>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
        <option value="food">Food</option>
        <option value="other">Other</option>
      </select>
    </div>
  </div>

  <button type="submit" disabled={$loading}>
    {#if $loading}
      Creating...
    {:else}
      Create Product
    {/if}
  </button>
</form>

<style>
  form {
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
  }

  label {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #333;
  }

  input,
  textarea,
  select {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: inherit;
    font-size: 1rem;
  }

  input:focus,
  textarea:focus,
  select:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }

  input:disabled,
  textarea:disabled,
  select:disabled {
    background-color: #f0f0f0;
    cursor: not-allowed;
  }

  button {
    padding: 0.75rem 1.5rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  button:hover:not(:disabled) {
    background: #0056b3;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .error {
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
</style>
