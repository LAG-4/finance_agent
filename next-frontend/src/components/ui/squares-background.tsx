'use client';

import React, { useEffect, useRef, useState } from 'react';

interface SquareProps {
  size: number;
  x: number;
  y: number;
  borderColor: string;
  fillColor: string;
  hoverFillColor: string;
  speed: number;
  direction: 'horizontal' | 'vertical' | 'diagonal';
}

const Square: React.FC<SquareProps> = ({
  size,
  x,
  y,
  borderColor,
  fillColor,
  hoverFillColor,
  speed,
  direction,
}) => {
  const [position, setPosition] = useState({ x, y });
  const [isHovered, setIsHovered] = useState(false);
  const squareRef = useRef<SVGRectElement>(null);

  useEffect(() => {
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      time += 0.01 * speed;
      
      let newX = position.x;
      let newY = position.y;
      
      if (direction === 'horizontal' || direction === 'diagonal') {
        newX = x + Math.sin(time) * 20;
      }
      
      if (direction === 'vertical' || direction === 'diagonal') {
        newY = y + Math.cos(time) * 20;
      }
      
      setPosition({ x: newX, y: newY });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [x, y, speed, direction]);

  return (
    <rect
      ref={squareRef}
      x={position.x}
      y={position.y}
      width={size}
      height={size}
      stroke={borderColor}
      strokeWidth={1}
      fill={isHovered ? hoverFillColor : fillColor}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ transition: 'fill 0.3s ease' }}
    />
  );
};

interface SquaresProps {
  squareSize?: number;
  count?: number;
  borderColor?: string;
  fillColor?: string;
  hoverFillColor?: string;
  speed?: number;
  direction?: 'horizontal' | 'vertical' | 'diagonal';
}

export const Squares: React.FC<SquaresProps> = ({
  squareSize = 30,
  count = 30,
  borderColor = '#e2e8f0',
  fillColor = 'transparent',
  hoverFillColor = 'rgba(59, 130, 246, 0.1)',
  speed = 1,
  direction = 'diagonal',
}) => {
  const containerRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 1000 });
  const [squares, setSquares] = useState<{ id: number; x: number; y: number }[]>([]);

  // Generate random squares
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
      
      const newSquares = Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * (width - squareSize),
        y: Math.random() * (height - squareSize),
      }));
      
      setSquares(newSquares);
    }
  }, [count, squareSize]);

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <svg
      ref={containerRef}
      width="100%"
      height="100%"
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      {squares.map(square => (
        <Square
          key={square.id}
          size={squareSize}
          x={square.x}
          y={square.y}
          borderColor={borderColor}
          fillColor={fillColor}
          hoverFillColor={hoverFillColor}
          speed={speed}
          direction={direction}
        />
      ))}
    </svg>
  );
};
