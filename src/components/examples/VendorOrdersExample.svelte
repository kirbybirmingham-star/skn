<script>
  /**
   * ============================================================================
   * EXAMPLE: Vendor Orders Management with Data Layer
   * ============================================================================
   * 
   * Shows how to manage orders using the data layer
   */

  import { onMount } from 'svelte';
  import { createOrdersStore, useOrderFulfillment } from '$lib/hooks/useDataLayer';
  import LoadingSpinner from './LoadingSpinner.svelte';
  import ErrorAlert from './ErrorAlert.svelte';

  const orders = createOrdersStore();
  const { fulfill, cancel, loading: actionLoading } = useOrderFulfillment();

  // Pagination state
  let currentPage = 1;
  const pageSize = 10;

  onMount(() => {
    loadOrders();
  });

  async function loadOrders() {
    await orders.fetch({ page: currentPage, limit: pageSize });
  }

  async function handleFulfill(orderId) {
    const result = await fulfill(orderId);
    if (result.success) {
      // Refresh orders list
      await loadOrders();
    }
  }

  async function handleCancel(orderId) {
    if (confirm('Are you sure you want to cancel this order?')) {
      const result = await cancel(orderId);
      if (result.success) {
        // Refresh orders list
        await loadOrders();
      }
    }
  }

  function nextPage() {
    currentPage++;
    loadOrders();
  }

  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
      loadOrders();
    }
  }
</script>

<div class="orders-container">
  <h1>Vendor Orders</h1>

  {#if $orders.loading && !$orders.loaded}
    <LoadingSpinner />
  {:else if $orders.hasError}
    <ErrorAlert message={$orders.error} />
  {:else if $orders.data && $orders.data.length > 0}
    <div class="orders-table">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each $orders.data as order (order.id)}
            <tr class="order-row status-{order.status}">
              <td class="order-id">{order.id.slice(0, 8)}</td>
              <td>{order.customer_name || 'Unknown'}</td>
              <td>${Number(order.total || 0).toFixed(2)}</td>
              <td>
                <span class="status-badge {order.status}">
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </td>
              <td>{new Date(order.created_at).toLocaleDateString()}</td>
              <td class="actions">
                {#if order.status === 'pending'}
                  <button
                    class="btn-primary"
                    on:click={() => handleFulfill(order.id)}
                    disabled={$actionLoading}
                  >
                    Fulfill
                  </button>
                  <button
                    class="btn-danger"
                    on:click={() => handleCancel(order.id)}
                    disabled={$actionLoading}
                  >
                    Cancel
                  </button>
                {:else if order.status === 'confirmed'}
                  <button
                    class="btn-primary"
                    on:click={() => handleFulfill(order.id)}
                    disabled={$actionLoading}
                  >
                    Ship
                  </button>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button on:click={prevPage} disabled={currentPage === 1}>
        Previous
      </button>
      <span>Page {currentPage}</span>
      <button on:click={nextPage} disabled={$orders.data.length < pageSize}>
        Next
      </button>
    </div>
  {:else}
    <p>No orders found</p>
  {/if}
</div>

<style>
  .orders-container {
    padding: 2rem;
  }

  h1 {
    margin-bottom: 2rem;
    color: #333;
  }

  .orders-table {
    overflow-x: auto;
    margin-bottom: 2rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  thead {
    background: #f8f9fa;
  }

  th,
  td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    font-weight: 600;
    color: #555;
  }

  .order-id {
    font-family: monospace;
    font-size: 0.875rem;
    color: #666;
  }

  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .status-badge.pending {
    background: #fff3cd;
    color: #856404;
  }

  .status-badge.confirmed {
    background: #cfe2ff;
    color: #084298;
  }

  .status-badge.shipped {
    background: #d1ecf1;
    color: #0c5460;
  }

  .status-badge.delivered {
    background: #d4edda;
    color: #155724;
  }

  .status-badge.cancelled {
    background: #f8d7da;
    color: #721c24;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #007bff;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #0056b3;
  }

  .btn-danger {
    background: #dc3545;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background: #c82333;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
  }

  .pagination button {
    padding: 0.5rem 1rem;
    background: #f0f0f0;
    color: #333;
    border: 1px solid #ddd;
  }

  .pagination button:hover:not(:disabled) {
    background: #e0e0e0;
  }

  .pagination button:disabled {
    background: #f0f0f0;
    color: #ccc;
    cursor: not-allowed;
  }
</style>
