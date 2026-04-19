import { Vector2d } from 'konva/lib/types';

export const snapToGrid = (pos: Vector2d, gridSize: number): Vector2d => {
  return {
    x: Math.round(pos.x / gridSize) * gridSize,
    y: Math.round(pos.y / gridSize) * gridSize,
  };
};

export const snapValue = (val: number, gridSize: number): number => {
  return Math.round(val / gridSize) * gridSize;
};
