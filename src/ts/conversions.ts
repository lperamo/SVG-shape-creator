/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Coordinate, Unit } from './types.ts';
import { state } from './state';

/**
 * Translates physical client pointer coordinates to logical paintboard space (0-400px).
 */
export function computeLogicalCoordinates(
  clientCoordinateX: number,
  clientCoordinateY: number,
  paintboardElement: HTMLElement,
  shouldClamp: boolean = false
): Coordinate
{
  const
    containerRectangle = paintboardElement.getBoundingClientRect(),
    borderLeftOffset = parseInt(window.getComputedStyle(paintboardElement).borderLeftWidth, 10) || 0,
    borderTopOffset = parseInt(window.getComputedStyle(paintboardElement).borderTopWidth, 10) || 0,
    usableWidth = paintboardElement.clientWidth || containerRectangle.width,
    usableHeight = paintboardElement.clientHeight || containerRectangle.height;

  let
    ratioCoordinateX = (clientCoordinateX - (containerRectangle.left + borderLeftOffset)) / usableWidth,
    ratioCoordinateY = (clientCoordinateY - (containerRectangle.top + borderTopOffset)) / usableHeight;

  if (shouldClamp)
  {
    ratioCoordinateX = Math.max(-.05, Math.min(1.05, ratioCoordinateX));
    ratioCoordinateY = Math.max(-.05, Math.min(1.05, ratioCoordinateY));
  }

  return {
    xCoordinate: ratioCoordinateX * 400,
    yCoordinate: ratioCoordinateY * 400
  };
}

/**
 * Converts value from specified unit to pure pixels on 400x400 canvas.
 */
export function convertUnitToPixels(value: number, unit: Unit): number
{
  if (unit === '%')
    return (value / 100) * 400;

  if (unit === 'rem')
    return value * state.parentFontSize;

  return value;
}

/**
 * Converts absolute pure canvas pixel coordinate to target units.
 */
export function convertPixelsToUnit(absolutePixelValue: number, unit: Unit): number
{
  if (unit === '%')
  {
    const calculatedPercentage = (absolutePixelValue / 400) * 100;
    return Math.round(calculatedPercentage * 10) / 10;
  }

  if (unit === 'rem')
  {
    const calculatedRem = absolutePixelValue / state.parentFontSize;
    return Math.round(calculatedRem * 1000) / 1000;
  }

  return Math.round(absolutePixelValue);
}