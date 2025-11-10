import React, { useState, useEffect } from 'react';
import { getReviews, createReview } from '../../api/EcommerceApi';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import StarRating from './StarRating';

const Reviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getReviews(productId);
        setReviews(data);
      } catch (error) {
        setError('Failed to fetch reviews.');
      }
    };
    fetchReviews();
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to submit a review.');
      return;
    }
    try {
      const newReview = await createReview({
        product_id: productId,
        user_id: user.id,
        rating,
        title,
        body,
      });
      setReviews([newReview, ...reviews]);
      setRating(0);
      setTitle('');
      setBody('');
    } catch (error) {
      setError('Failed to submit review.');
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
      {error && <p className="text-red-500">{error}</p>}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-2">Write a review</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="rating" className="block mb-1">Rating</label>
            <input
              type="number"
              id="rating"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="title" className="block mb-1">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="body" className="block mb-1">Body</label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-2 border rounded"
              rows="4"
              required
            ></textarea>
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Submit Review
          </button>
        </form>
      </div>
      <div>
        {reviews.map((review) => (
          <div key={review.id} className="border-b pb-4 mb-4">
            <div className="flex items-center mb-2">
              <StarRating rating={review.rating} />
              <span className="ml-2 font-bold">{review.title}</span>
            </div>
            <p className="text-gray-700">{review.body}</p>
            <p className="text-sm text-gray-500 mt-2">
              By {review.user?.raw_user_meta_data?.full_name || 'Anonymous'} on {new Date(review.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reviews;
