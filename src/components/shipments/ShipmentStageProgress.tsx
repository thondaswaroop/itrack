// ShipmentStageProgress component - Circular ring progress indicator
import React from 'react';
import { DISPLAY_STAGES, getDisplayStageIndex, type ShipmentStatus } from '../../constants/shipmentStatus';

interface ShipmentStageProgressProps {
  currentStatus: ShipmentStatus;
  className?: string;
  size?: number;
}

export const ShipmentStageProgress: React.FC<ShipmentStageProgressProps> = ({ 
  currentStatus,
  className = '',
  size = 200
}) => {
  const currentIndex = getDisplayStageIndex(currentStatus);
  
  // Colors for each stage
  const stageColors = [
    '#3b82f6',  // Blue - Received
    '#f59e0b',  // Orange - Consolidation  
    '#10b981',  // Green - Shipped
    '#eab308',  // Yellow - In Transit
    '#3b82f6',  // Blue - Delivered
  ];

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size / 2) - 20;
  const strokeWidth = 30;
  
  // Calculate segments (5 equal parts)
  const segmentAngle = 360 / DISPLAY_STAGES.length;
  const gapAngle = 2; // Small gap between segments
  
  // Create SVG path for each segment
  const createSegmentPath = (index: number) => {
    const startAngle = (index * segmentAngle - 90); // Start from top
    const endAngle = startAngle + segmentAngle - gapAngle;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArcFlag = segmentAngle - gapAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Circular Ring */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-0">
          {/* Background circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
          />
          
          {/* Stage segments */}
          {DISPLAY_STAGES.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isActive = index === currentIndex;
            const opacity = isCompleted || isActive ? 1 : 0.3;
            
            return (
              <path
                key={stage.key}
                d={createSegmentPath(index)}
                fill="none"
                stroke={stageColors[index]}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={opacity}
                className="transition-opacity duration-300"
              />
            );
          })}
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-3xl mb-2">{DISPLAY_STAGES[currentIndex]?.icon}</div>
            <div className="text-sm font-bold text-gray-700">{DISPLAY_STAGES[currentIndex]?.label}</div>
            <div className="text-xs text-gray-500 mt-1">Stage {currentIndex + 1} of {DISPLAY_STAGES.length}</div>
          </div>
        </div>
      </div>
      
      {/* Stage Labels Below Circle with Numbers */}
      <div className="mt-6 w-full max-w-xs">
        <div className="space-y-3">
          {DISPLAY_STAGES.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isActive = index === currentIndex;
            
            return (
              <div key={stage.key} className="flex items-center gap-3 py-1">
                <div
                  className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center transition-all font-bold text-sm ${
                    isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-blue-500 text-white ring-2 ring-blue-200' : 'bg-gray-200 text-gray-400'
                  }`}
                  style={{ backgroundColor: isCompleted || isActive ? stageColors[index] : undefined }}
                >
                  {index + 1}
                </div>
                <span className={`text-sm flex-1 ${isActive ? 'font-bold text-gray-900' : isCompleted ? 'font-medium text-gray-700' : 'text-gray-400'}`}>
                  {stage.label}
                </span>
                {isCompleted && (
                  <svg className="w-5 h-5 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {isActive && (
                  <div className="ml-auto">
                    <svg className="w-5 h-5 text-blue-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="4" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShipmentStageProgress;
