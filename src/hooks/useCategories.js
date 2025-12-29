import { useEffect, useState } from 'react';
import { getCategories } from '@/api/EcommerceApi';

/**
 * Hook to fetch and manage categories
 * Returns list of categories with loading state
 */
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCategories();
        // Ensure we have categories, add default if empty
        const categoriesList = Array.isArray(data) ? data : [];
        
        // Always include "Uncategorized"
        const hasUncategorized = categoriesList.some(c => 
          c.name?.toLowerCase() === 'uncategorized'
        );
        
        if (!hasUncategorized) {
          categoriesList.unshift({
            id: 'uncategorized-default',
            name: 'Uncategorized',
            slug: 'uncategorized'
          });
        }
        
        // Sort alphabetically, keeping Uncategorized first
        const sorted = categoriesList.sort((a, b) => {
          if (a.name?.toLowerCase() === 'uncategorized') return -1;
          if (b.name?.toLowerCase() === 'uncategorized') return 1;
          return (a.name || '').localeCompare(b.name || '');
        });
        
        setCategories(sorted);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError(err.message);
        // Set default on error
        setCategories([
          { id: 'uncategorized-default', name: 'Uncategorized', slug: 'uncategorized' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return { categories, loading, error };
}
