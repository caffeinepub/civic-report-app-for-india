import type React from "react";
import { useEffect, useRef, useState } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  priority?: "high" | "low";
  placeholder?: React.ReactNode;
}

export function LazyImage({
  src,
  alt,
  className = "",
  style = {},
  onClick,
  priority = "low",
  placeholder,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // High priority images load immediately
    if (priority === "high") {
      setIsInView(true);
      return;
    }

    // Low priority images use IntersectionObserver
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: "50px", // Start loading 50px before entering viewport
      threshold: 0.01,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // Once in view, disconnect observer
          if (observerRef.current && imgRef.current) {
            observerRef.current.unobserve(imgRef.current);
          }
        }
      });
    }, options);

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Placeholder shown while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {placeholder || (
            <div className="animate-pulse bg-gray-200 w-full h-full" />
          )}
        </div>
      )}

      {/* Actual image - only load when in view */}
      <img
        ref={imgRef}
        src={isInView ? src : ""}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        style={style}
        onLoad={handleLoad}
        onClick={onClick}
        loading={priority === "high" ? "eager" : "lazy"}
      />
    </div>
  );
}
