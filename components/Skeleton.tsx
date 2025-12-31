import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => {
  return (
    <div 
      className={`animate-pulse bg-white/5 rounded ${className}`}
      style={{
        animationDuration: '1.5s',
        backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.02) 100%)',
        backgroundSize: '200% 100%',
      }}
    />
  );
};

export default Skeleton;