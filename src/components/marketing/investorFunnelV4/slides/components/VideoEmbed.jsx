import React, { useState } from 'react';
import { Play } from 'lucide-react';

/**
 * VideoEmbed component for embedding videos in investor slides
 * Supports YouTube, Vimeo, and local MP4 videos
 * 
 * @param {Object} props Component props
 * @param {string} props.src Video source URL or path
 * @param {string} props.type Video type: 'youtube', 'vimeo', or 'local'
 * @param {string} props.title Video title for accessibility
 * @param {string} props.posterImage Optional poster image URL for local videos
 * @param {boolean} props.autoPlay Whether to autoplay the video
 * @param {Object} props.aspectRatio Aspect ratio for the video container
 * @param {string} props.className Additional CSS classes
 */
const VideoEmbed = ({ 
  src,
  type = 'youtube',
  title = 'Video',
  posterImage,
  autoPlay = false, 
  aspectRatio = { width: 16, height: 9 },
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleVideoClick = () => {
    setIsPlaying(true);
  };

  const handleVideoLoad = () => {
    setIsLoaded(true);
  };

  // Calculate aspect ratio padding
  const paddingBottom = `${(aspectRatio.height / aspectRatio.width) * 100}%`;

  // Extract video ID for YouTube or Vimeo
  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getVimeoId = (url) => {
    const regExp = /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
    const match = url.match(regExp);
    return match ? match[5] : null;
  };

  // Create appropriate embed URL
  const getEmbedUrl = () => {
    if (type === 'youtube') {
      const videoId = getYouTubeId(src);
      return `https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&rel=0`;
    } else if (type === 'vimeo') {
      const videoId = getVimeoId(src);
      return `https://player.vimeo.com/video/${videoId}?autoplay=${isPlaying ? 1 : 0}`;
    }
    return src;
  };

  return (
    <div 
      className={`relative rounded-lg overflow-hidden shadow-lg ${className}`}
      style={{ paddingBottom }}
    >
      {/* Local video player */}
      {type === 'local' && (
        <>
          {(!isPlaying || !isLoaded) && posterImage && (
            <div 
              className="absolute inset-0 bg-cover bg-center cursor-pointer flex items-center justify-center"
              style={{ backgroundImage: `url(${posterImage})` }}
              onClick={handleVideoClick}
            >
              <div className="w-16 h-16 bg-indigo-600 bg-opacity-80 rounded-full flex items-center justify-center">
                <Play size={32} className="text-white ml-1" />
              </div>
            </div>
          )}
          <video
            src={src}
            poster={posterImage}
            controls={isPlaying}
            autoPlay={isPlaying}
            className="absolute inset-0 w-full h-full object-cover"
            title={title}
            onLoadedData={handleVideoLoad}
          />
        </>
      )}

      {/* YouTube or Vimeo iframe */}
      {(type === 'youtube' || type === 'vimeo') && (
        <>
          {!isPlaying && posterImage && (
            <div 
              className="absolute inset-0 bg-cover bg-center cursor-pointer flex items-center justify-center"
              style={{ backgroundImage: `url(${posterImage})` }}
              onClick={handleVideoClick}
            >
              <div className="w-16 h-16 bg-indigo-600 bg-opacity-80 rounded-full flex items-center justify-center">
                <Play size={32} className="text-white ml-1" />
              </div>
            </div>
          )}
          {isPlaying && (
            <iframe
              src={getEmbedUrl()}
              title={title}
              className="absolute inset-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </>
      )}
    </div>
  );
};

export default VideoEmbed;