import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';

// Mock Select components since they don't exist yet
const Select = ({ children, value, onValueChange }) => (
  <div className="relative">
    <select
      className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  </div>
);

const SelectTrigger = ({ children, className }) => (
  <div className={className}>{children}</div>
);

const SelectValue = ({ placeholder }) => (
  <span className="text-muted-foreground">{placeholder}</span>
);

const SelectContent = ({ children }) => <>{children}</>;

const SelectItem = ({ value, children }) => (
  <option value={value}>{children}</option>
);

// Status options for filtering
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' }
];

// Sort options
const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Newest First' },
  { value: 'created_at_asc', label: 'Oldest First' },
  { value: 'total_amount_desc', label: 'Highest Amount' },
  { value: 'total_amount_asc', label: 'Lowest Amount' },
  { value: 'status', label: 'Status' }
];

const OrderFilters = ({
  filters,
  onFiltersChange,
  totalOrders = 0,
  isLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      onFiltersChange({ ...filters, search: value, page: 1 });
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleStatusChange = (value) => {
    const status = value === 'all' ? '' : value;
    onFiltersChange({ ...filters, status, page: 1 });
  };

  const handleSortChange = (value) => {
    const [sort_by, sort_order] = value.split('_');
    onFiltersChange({
      ...filters,
      sort_by,
      sort_order: sort_order === 'desc' ? 'desc' : 'asc',
      page: 1
    });
  };

  const handleDateRangeChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value,
      page: 1
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    onFiltersChange({
      status: '',
      search: '',
      sort_by: 'created_at',
      sort_order: 'desc',
      start_date: '',
      end_date: '',
      page: 1,
      limit: 20
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.search) count++;
    if (filters.start_date) count++;
    if (filters.end_date) count++;
    return count;
  };

  const getCurrentSortValue = () => {
    return `${filters.sort_by || 'created_at'}_${filters.sort_order || 'desc'}`;
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">
            Orders ({totalOrders})
          </CardTitle>
          <div className="flex items-center gap-2">
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} active
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="w-4 h-4 mr-2" />
              {showAdvanced ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder="Search orders by ID, product name..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full"
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Status Filter */}
          <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={getCurrentSortValue()} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Start Date */}
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">From Date</label>
                <Input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => handleDateRangeChange('start_date', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* End Date */}
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">To Date</label>
                <Input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => handleDateRangeChange('end_date', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={getActiveFiltersCount() === 0}
                  className="w-full sm:w-auto"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {getActiveFiltersCount() > 0 && (
          <div className="border-t pt-4">
            <div className="flex flex-wrap gap-2">
              {filters.status && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Status: {STATUS_OPTIONS.find(opt => opt.value === filters.status)?.label}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleStatusChange('all')}
                  />
                </Badge>
              )}
              {filters.search && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{filters.search}"
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleSearchChange('')}
                  />
                </Badge>
              )}
              {filters.start_date && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  From: {filters.start_date}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleDateRangeChange('start_date', '')}
                  />
                </Badge>
              )}
              {filters.end_date && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  To: {filters.end_date}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => handleDateRangeChange('end_date', '')}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderFilters;