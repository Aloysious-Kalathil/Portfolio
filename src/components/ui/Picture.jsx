import { useState } from 'react'

/**
 * Responsive image in modern formats. `src` is extension-less; the build
 * expects `${src}-800.{avif,webp}` and `${src}-1600.{avif,webp}` (see
 * README → Images). Lazy + async-decoded by default, fades in on load, and
 * keeps a quiet tinted box as its loading state.
 */
export default function Picture({
  src,
  alt,
  sizes = '100vw',
  loading = 'lazy',
  fetchPriority,
  width = 1600,
  height = 1000,
  className = '',
  imgClassName = 'h-full w-full object-cover',
  fade = true,
  onLoad,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false)
  const set = (ext) => `${src}-800.${ext} 800w, ${src}-1600.${ext} 1600w`

  const handleLoad = (event) => {
    setLoaded(true)
    onLoad?.(event)
  }

  return (
    <picture className={`block bg-fg/[0.06] ${className}`}>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img
        src={`${src}-1600.webp`}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        ref={(img) => {
          // Cached images may finish before React attaches onLoad
          if (img?.complete && img.naturalWidth && !loaded) {
            setLoaded(true)
            onLoad?.({ currentTarget: img, target: img })
          }
        }}
        onLoad={handleLoad}
        className={`${imgClassName} ${fade ? `transition-opacity duration-800 ease-out-expo ${loaded ? 'opacity-100' : 'opacity-0'}` : ''}`}
        {...rest}
      />
    </picture>
  )
}

/** The 1600px WebP URL for an extension-less image path (WebGL textures). */
export const pictureUrl = (src, size = 1600) => `${src}-${size}.webp`
