import React, { useState } from 'react';

/**
 * Resilient institutional image component.
 * Accepts either:
 * - A string URL (imported asset or web URL)
 * - A media registry object (e.g. from MEDIA_REGISTRY or getHostelImage)
 * 
 * Automatically fails over to remote fallback on error, and renders
 * an accessible institutional placeholder if all sources fail.
 */
export default function ImageWithFallback({
  src,
  fallbackSrc,
  alt,
  className = '',
  style = {},
  aspectRatio = '16/10',
  loading = 'lazy',
  objectFit = 'cover'
}) {
  // Resolve source whether passed as string or as media object
  const resolvedSrc = (typeof src === 'object' && src !== null)
    ? (src.src || src.localSrc || src.publicPath)
    : src;

  const resolvedFallback = fallbackSrc || (
    (typeof src === 'object' && src !== null)
      ? (src.fallbackSrc || src.remoteFallback)
      : undefined
  );

  const resolvedAlt = alt || (
    (typeof src === 'object' && src !== null && src.alt)
      ? src.alt
      : 'Government Polytechnic Sakoli campus facility'
  );

  const [useFallback, setUseFallback] = useState(false);
  const [failedSrc, setFailedSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync state during render when resolvedSrc changes (React recommended pattern)
  const [prevResolvedSrc, setPrevResolvedSrc] = useState(resolvedSrc);
  if (prevResolvedSrc !== resolvedSrc) {
    setPrevResolvedSrc(resolvedSrc);
    setUseFallback(false);
    setFailedSrc(null);
    setIsLoaded(false);
  }

  const currentSrc = useFallback ? resolvedFallback : resolvedSrc;
  const hasError = failedSrc === currentSrc || !currentSrc;

  const handleError = () => {
    if (!useFallback && resolvedFallback && resolvedFallback !== resolvedSrc) {
      setUseFallback(true);
    } else {
      setFailedSrc(currentSrc);
    }
  };

  if (hasError) {
    return (
      <div
        className={`image-fallback-placeholder ${className}`}
        style={{
          aspectRatio,
          backgroundColor: '#0b192c',
          color: '#94a3b8',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          textAlign: 'center',
          borderRadius: 'inherit',
          ...style
        }}
        role="img"
        aria-label={resolvedAlt}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7, marginBottom: '0.5rem' }}>
          <path d="M3 21h18"/>
          <path d="M5 21V7l8-4v18"/>
          <path d="M19 21V11l-6-4"/>
          <path d="M9 9h1"/>
          <path d="M9 13h1"/>
          <path d="M9 17h1"/>
        </svg>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#f8fafc' }}>
          Government Polytechnic Sakoli
        </span>
        <span style={{ fontSize: '0.7rem', opacity: 0.75, marginTop: '0.2rem' }}>
          Campus Residential Premises
        </span>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={resolvedAlt}
      loading={loading}
      onLoad={() => setIsLoaded(true)}
      onError={handleError}
      className={className}
      style={{
        objectFit,
        aspectRatio,
        opacity: isLoaded ? 1 : 0.6,
        transition: 'opacity 0.2s ease-in-out',
        ...style
      }}
    />
  );
}
