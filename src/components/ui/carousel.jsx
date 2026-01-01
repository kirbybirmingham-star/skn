import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

const Carousel = ({
  children,
  className,
  showDots = true,
  showArrows = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  itemsPerView = 1,
  infinite = true,
  ...props
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const childrenArray = React.Children.toArray(children);
  const totalItems = childrenArray.length;
  const totalSlides = Math.ceil(totalItems / itemsPerView);

  useEffect(() => {
    if (!autoPlay || totalSlides <= 1) return;

    const interval = setInterval(() => {
      next();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, currentIndex, totalSlides]);

  const next = () => {
    if (isTransitioning || totalSlides <= 1) return;

    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      if (prev >= totalSlides - 1) {
        return infinite ? 0 : prev;
      }
      return prev + 1;
    });

    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prev = () => {
    if (isTransitioning || totalSlides <= 1) return;

    setIsTransitioning(true);
    setCurrentIndex((prev) => {
      if (prev <= 0) {
        return infinite ? totalSlides - 1 : prev;
      }
      return prev - 1;
    });

    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex || totalSlides <= 1) return;

    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Create slides array - each slide contains itemsPerView items
  const slides = [];
  for (let i = 0; i < totalSlides; i++) {
    const startIndex = i * itemsPerView;
    const slideItems = childrenArray.slice(startIndex, startIndex + itemsPerView);
    // Pad the slide with empty items if needed to maintain consistent layout
    while (slideItems.length < itemsPerView) {
      slideItems.push(null);
    }
    slides.push(slideItems);
  }

  return (
    <div className={cn("relative", className)} {...props}>
      <div className="overflow-hidden rounded-lg">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            width: `${totalSlides * 100}%`
          }}
        >
          {slides.map((slide, slideIndex) => (
            <div
              key={slideIndex}
              className="flex"
              style={{ width: `${100 / totalSlides}%` }}
            >
              {slide.map((child, itemIndex) => (
                <div
                  key={`${slideIndex}-${itemIndex}`}
                  className="flex-1"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  {child ? (
                    child
                  ) : (
                    <div className="invisible">
                      {/* Invisible placeholder to maintain layout */}
                      <div className="aspect-square bg-transparent" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {showArrows && totalSlides > 1 && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg border-0"
            onClick={prev}
            disabled={!infinite && currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg border-0"
            onClick={next}
            disabled={!infinite && currentIndex >= totalSlides - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && totalSlides > 1 && (
        <div className="flex justify-center space-x-2 mt-4">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
              )}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CarouselItem = ({ children, className, ...props }) => (
  <div className={cn("", className)} {...props}>
    {children}
  </div>
);

export { Carousel, CarouselItem };