import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({
  src,
  alt,
  className = '',
  placeholder = '',
  onLoad = () => {},
  onError = () => {},
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef();
  const observerRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleLoad = () => {
    console.log('🖼️ LazyImage: Image loaded successfully:', src?.substring(0, 60));
    setIsLoaded(true);
    onLoad();
  };

  const handleError = () => {
    console.error('🖼️ LazyImage: Image FAILED to load from:', src);

    // Try to retry loading a few times before giving up
    if (retryCount < 2) {
      console.log(`🖼️ LazyImage: Retrying load (attempt ${retryCount + 1})`);
      setRetryCount(prev => prev + 1);
      setHasError(false);
      // Force re-render by triggering a state change
      setTimeout(() => {
        setHasError(false);
      }, 100);
    } else {
      console.error('🖼️ LazyImage: Giving up after retries for:', src?.substring(0, 60));
      setHasError(true);
      onError();
    }
  };

  return (
    <div ref={imgRef} className="relative">
      {/* Placeholder/Loading State */}
      {!isLoaded && !hasError && (
        <div className={`absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-50 animate-pulse rounded-md flex items-center justify-center ${className}`}>
          <div className="text-slate-400 text-sm">Loading image...</div>
        </div>
      )}

      {/* Fallback for error state */}
      {hasError && (
        <div className={`absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 rounded-md flex items-center justify-center border border-gray-200 ${className}`}>
          <div className="text-gray-600 text-sm text-center p-2">
            <div className="font-medium">🖼️ Image</div>
            <div className="text-xs text-gray-500">Coming Soon</div>
            {placeholder && <div className="text-xs mt-1 text-gray-400">{placeholder}</div>}
          </div>
        </div>
      )}

      {/* Actual Image - Always render when in view, regardless of error state */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;