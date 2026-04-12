import React from 'react';

export const Skeleton = ({ className = "" }) => {
  return (
    <div className={`animate-pulse bg-white/10 rounded-xl ${className}`}></div>
  );
};

export const ProjectCardSkeleton = () => {
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-[200px] border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
      <div>
        <Skeleton className="h-6 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex justify-between items-center mt-6">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-8 w-1/3 rounded-lg" />
      </div>
    </div>
  );
};
