'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

interface SphereVisualizerProps {
  isRecording: boolean;
  isAnimating: boolean;
  className?: string;
}

const SphereVisualizer: React.FC<SphereVisualizerProps> = ({
  isRecording,
  isAnimating,
  className
}) => {
  const sphereRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn(
      "relative w-44 h-44",
      className
    )}>
      {/* Main sphere */}
      <div
        ref={sphereRef}
        className={cn(
          "w-44 h-44 rounded-full",
          "bg-gradient-to-r from-alia-primary/40 to-alia-secondary/40",
          "relative",
          isAnimating && [
            "animate-sphere-rotate-fast",
            "animate-sphere-pulse-fast"
          ]
        )}
      >
        {/* Particle effect layers */}
        <div className={cn(
          "absolute inset-0 rounded-full bg-[url('/image/voice/glow.png')] bg-cover bg-center opacity-70",
          isAnimating && "animate-sphere-particles-fast"
        )} />
        
        {/* Glow effects */}
        <div className={cn(
          "absolute -inset-4 bg-alia-primary/20 rounded-full blur-xl",
          isAnimating && "animate-sphere-glow-fast"
        )} />
        <div className={cn(
          "absolute -inset-2 bg-alia-secondary/20 rounded-full blur-lg",
          isAnimating && "animate-sphere-pulse-fast"
        )} />
        
        {/* Inner sphere */}
        <div className={cn(
          "absolute inset-4 rounded-full bg-gradient-to-r from-alia-primary/30 to-alia-secondary/30",
          isAnimating && "animate-sphere-inner-fast"
        )} />
      </div>
    </div>
  );
};

export default SphereVisualizer;