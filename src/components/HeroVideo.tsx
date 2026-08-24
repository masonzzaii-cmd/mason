import React, { useEffect, useRef } from 'react';

export const HeroVideo: React.FC = () => {
  const videoUrl = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_112712_da9d53df-6d27-4b12-bdf6-aa9dc2622bdf.mp4";
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(err => {
        console.log("Autoplay prevented:", err);
      });
    }
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none select-none bg-[#050505]">
      {/* Background Cinematic Video Stream */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none scale-105 filter brightness-[0.8] contrast-[1.1] saturate-[0.9]"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Cinematic Dark Gradient Overlays */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: `
            linear-gradient(to bottom,
              rgba(5,5,5,0) 65%, 
              rgba(5,5,5,0.4) 80%, 
              rgba(5,5,5,0.85) 92%, 
              #050505 100%),
            linear-gradient(to right,
              #050505 0%,
              rgba(5,5,5,0.3) 20%,
              transparent 50%,
              rgba(5,5,5,0.3) 80%,
              #050505 100%),
            radial-gradient(circle at 50% 50%, transparent 40%, rgba(5,5,5,0.55) 90%)
          `
        }}
      />
    </div>
  );
};

export default HeroVideo;


