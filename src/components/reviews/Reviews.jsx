import React, { useState, useEffect } from 'react';
import { createReview } from '../../api/EcommerceApi';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import StarRating from './StarRating';
import { supabase } from '../../lib/customSupabaseClient';

const Reviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [productRating, setProductRating] = useState(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Fetch aggregated product rating and individual reviews
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.debug('[Reviews] Fetching for productId:', productId);

        // Fetch individual reviews from reviews table
        if (supabase) {
          try {
            const { data: reviewsData, error: reviewError } = await supabase
              .from('reviews')
              .select('*')
              .eq('product_id', productId)
              .order('created_at', { ascending: false });

            if (!reviewError && reviewsData && reviewsData.length > 0) {
              // Calculate aggregates from reviews
              const avgRating = reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsData.length;
              console.debug('[Reviews] Product rating:', { avg_rating: avgRating, review_count: reviewsData.length });
              setProductRating({ 
                avg_rating: avgRating,
                review_count: reviewsData.length 
              });

              setReviews(reviewsData);
              setError(null);
            } else {
              setReviews([]);
              setError(null);
            }
          } catch (err) {
            console.warn('[Reviews] Could not fetch reviews:', err.message);
            setReviews([]);
            setError(null);
          }
        }
      } catch (err) {
        console.error('[Reviews] Error fetching data:', err);
        setError('Failed to load reviews.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchData();
    }
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to submit a review.');
      return;
    }
    if (!rating || !title.trim() || !body.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      const newReview = await createReview({
        product_id: productId,
        user_id: user.id,
        rating: parseInt(rating),
        title: title.trim(),
        body: body.trim(),
      });

      // Add to list and reset form
      setReviews([newReview, ...reviews]);
      setRating(0);
      setTitle('');
      setBody('');
      setError(null);

      // Refresh aggregated rating
      if (supabase) {
        const { data: ratingsData } = await supabase
          .from('product_ratings')
          .select('rating')
          .eq('product_id', productId);
        
        if (ratingsData && ratingsData.length > 0) {
          const avgRating = ratingsData.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingsData.length;
          setProductRating({ 
            avg_rating: avgRating,
            review_count: ratingsData.length 
          });
        }
      }
    } catch (err) {
      console.error('[Reviews] Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      {/* Aggregated Rating Summary */}
      {productRating && (
        <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-3xl font-bold text-slate-900">
                {Number(productRating.avg_rating).toFixed(1)}
              </div>
              <div className="text-sm text-slate-600">out of 5</div>
            </div>
            <div>
              <StarRating rating={Math.round(Number(productRating.avg_rating))} />
              <div className="text-sm text-slate-600 mt-1">
                Based on {productRating.review_count} {productRating.review_count === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
      {error && !loading && <p className="text-red-500 mb-4">{error}</p>}

      {/* Review Form */}
      <div className="mb-8 p-4 border border-slate-200 rounded-lg">
        <h3 className="text-xl font-bold mb-4">Write a review</h3>
        {!user && (
          <p className="text-slate-600 text-sm mb-4">
            You must be <a href="/login" className="text-blue-600 underline">logged in</a> to submit a review.
          </p>
        )}
        {user && (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="rating" className="block font-medium mb-2">
                Rating <span className="text-red-500">*</span>
              </label>
              <select
                id="rating"
                value={rating}
                onChange={(e) => setRating(parseInt(e.target.value) || 0)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="0">Select a rating...</option>
                <option value="1">1 - Poor</option>
                <option value="2">2 - Fair</option>
                <option value="3">3 - Good</option>
                <option value="4">4 - Very Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="title" className="block font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sum up your experience"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="body" className="block font-medium mb-2">
                Your Review <span className="text-red-500">*</span>
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Tell others what you think..."
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}
      </div>

      {/* Individual Reviews List */}
      <div>
        {loading && reviews.length === 0 ? (
          <div className="text-center py-8 text-slate-600">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-slate-600">No reviews yet. Be the first to review!</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.rating} />
                    <span className="font-bold text-slate-900">{review.title}</span>
                  </div>
                </div>
                <p className="text-slate-700 mb-2">{review.body}</p>
                <p className="text-xs text-slate-500">
                  By {review.user?.raw_user_meta_data?.full_name || 'Anonymous'} on {new Date(review.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
