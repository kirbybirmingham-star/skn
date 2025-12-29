import React from 'react';
import { useCategories } from '@/hooks/useCategories';

/**
 * Category dropdown selector
 * Fetches categories and displays them with option to create new
 */
const CategorySelect = ({ 
  value, 
  onChange, 
  onCreateNew,
  disabled = false,
  label = 'Category'
}) => {
  const { categories, loading } = useCategories();
  const [showCreateNew, setShowCreateNew] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');

  const handleSelectChange = (e) => {
    const selectedValue = e.target.value;
    if (selectedValue === '__create_new__') {
      setShowCreateNew(true);
    } else {
      onChange(selectedValue); // Now passes category ID
      setShowCreateNew(false);
    }
  };

  const handleCreateNewCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }
    
    if (onCreateNew) {
      const created = await onCreateNew(newCategoryName.trim());
      if (created) {
        // created should be the category ID
        onChange(created);
        setNewCategoryName('');
        setShowCreateNew(false);
      }
    } else {
      // If no callback provided, just set the value
      onChange(newCategoryName.trim());
      setNewCategoryName('');
      setShowCreateNew(false);
    }
  };

  // Find category by ID or name
  const findCategoryByValue = (val) => {
    return categories.find(c => c.id === val || c.name === val);
  };

  const selectedCategory = findCategoryByValue(value);
  const displayValue = selectedCategory?.name || 'Select a category';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      <div className="relative">
        <select
          value={value || ''}
          onChange={handleSelectChange}
          disabled={disabled || loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">
            {loading ? 'Loading categories...' : 'Select a category'}
          </option>
          {loading ? null : (
            <>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
              <option value="__create_new__">+ Create New Category</option>
            </>
          )}
        </select>
      </div>

      {showCreateNew && (
        <div className="mt-3 p-3 border border-blue-200 rounded-md bg-blue-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Category Name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateNewCategory();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCreateNewCategory}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateNew(false);
                setNewCategoryName('');
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-1">
        {loading ? 'Loading categories...' : `${categories.length} categories available`}
      </p>
    </div>
  );
};

export default CategorySelect;
