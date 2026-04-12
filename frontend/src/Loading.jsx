import React from 'react'

const Loading = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-16 h-16 rounded-full border-4 border-brand-purple/20"></div>
        <div className="absolute w-16 h-16 rounded-full border-4 border-brand-cyan border-t-transparent animate-spin"></div>
        <div className="absolute w-8 h-8 rounded-full bg-brand-purple/20 animate-pulse"></div>
      </div>
    </div>
  )
}

export default Loading