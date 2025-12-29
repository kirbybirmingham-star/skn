import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { CheckCircle, AlertCircle, Loader2, Database } from 'lucide-react';
import DatabaseDebugConsole from '@/components/admin/DatabaseDebugConsole';

const AdminPanel = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);

  // Inline migration function
  const fixImageUrlsMigration = async () => {
    if (!supabase) throw new Error('Supabase client not available');
    
    // Get current user for authorization check
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError || !currentUser) {
      throw new Error('You must be logged in to run this migration');
    }
    
    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();
    
    if (profileError || !userProfile) {
      throw new Error('Unable to verify user role');
    }
    
    if (userProfile.role !== 'admin') {
      throw new Error('Only admins can run this migration');
    }
    
    // Fetch all products with undefined in image_url
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, title, image_url, vendor_id, metadata');
    
    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }
    
    if (!products || products.length === 0) {
      return { success: true, message: 'No products with undefined image URLs found', processed: 0 };
    }
    
    const productsWithUndefinedUrls = products.filter(p => p.image_url && p.image_url.includes('undefined'));
    
    if (productsWithUndefinedUrls.length === 0) {
      return { success: true, message: 'No products with undefined image URLs found', processed: 0 };
    }
    
    const results = {
      success: true,
      processed: 0,
      updated: 0,
      errors: [],
      details: []
    };
    
    for (const product of productsWithUndefinedUrls) {
      try {
        results.processed++;
        
        // Fix the image URL by replacing undefined with the actual vendor_id
        const fixedImageUrl = product.image_url.replace(
          '/vendors/undefined/',
          `/vendors/${product.vendor_id}/`
        );
        
        // Ensure metadata exists and has category
        const metadata = (product.metadata && typeof product.metadata === 'object')
          ? product.metadata
          : {};
        
        if (!metadata.category) {
          metadata.category = 'Uncategorized';
        }
        
        const { error: updateError } = await supabase
          .from('products')
          .update({
            image_url: fixedImageUrl,
            metadata: metadata
          })
          .eq('id', product.id);
        
        if (updateError) {
          results.errors.push({
            productId: product.id,
            title: product.title,
            error: updateError.message
          });
        } else {
          results.updated++;
          results.details.push({
            productId: product.id,
            title: product.title,
            oldUrl: product.image_url,
            newUrl: fixedImageUrl,
            category: metadata.category
          });
        }
      } catch (err) {
        results.errors.push({
          productId: product.id,
          title: product.title,
          error: err.message
        });
      }
    }
    
    return results;
  };

  useEffect(() => {
    // Check if user is admin
    if (!user) {
      navigate('/login');
      return;
    }

    // Check admin role from metadata or profile
    const adminRole = user?.user_metadata?.role === 'admin' || profile?.role === 'admin';
    if (!adminRole) {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can access this panel',
        variant: 'destructive'
      });
      navigate('/');
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  }, [user, profile, navigate, toast]);

  const handleFixImageUrls = async () => {
    setRunning(true);
    setResults(null);

    try {
      const migrationResults = await fixImageUrlsMigration();
      
      setResults(migrationResults);

      if (migrationResults.success) {
        toast({
          title: 'Migration Complete',
          description: `Updated ${migrationResults.updated} out of ${migrationResults.processed} products`
        });
      } else {
        toast({
          title: 'Migration Failed',
          description: migrationResults.message,
          variant: 'destructive'
        });
      }
    } catch (err) {
      console.error('Migration error:', err);
      toast({
        title: 'Migration Error',
        description: err.message || 'An error occurred during migration',
        variant: 'destructive'
      });
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <p>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <div className="grid gap-6 max-w-2xl">
        {/* Image URL Migration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Image URL Migration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              This migration fixes product image URLs that contain "undefined" vendor IDs and ensures all products have a category in their metadata.
            </p>

            <Button
              onClick={handleFixImageUrls}
              disabled={running}
              className="w-full"
            >
              {running && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {running ? 'Running Migration...' : 'Run Image URL Migration'}
            </Button>

            {/* Results Section */}
            {results && (
              <div className="mt-6 space-y-4">
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    {results.success && results.updated === results.processed ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Migration Successful
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        Migration Summary
                      </>
                    )}
                  </h3>

                  <div className="bg-slate-50 rounded p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Products Processed:</span>
                      <span className="font-semibold">{results.processed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Successfully Updated:</span>
                      <span className="font-semibold text-green-600">{results.updated}</span>
                    </div>
                    {results.errors.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Errors:</span>
                        <span className="font-semibold text-red-600">{results.errors.length}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details of Updated Products */}
                {results.details && results.details.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Updated Products:</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {results.details.map((detail) => (
                        <div key={detail.productId} className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                          <p className="font-medium text-green-900">{detail.title}</p>
                          <p className="text-green-800 text-xs mt-1">
                            Category: <span className="font-semibold">{detail.category}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors Section */}
                {results.errors && results.errors.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 text-red-600">Errors:</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {results.errors.map((error) => (
                        <div key={error.productId} className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                          <p className="font-medium text-red-900">{error.title}</p>
                          <p className="text-red-800 text-xs mt-1">{error.error}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Debug Console */}
        <Card>
          <CardContent className="pt-6">
            <DatabaseDebugConsole maxLogs={50} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
