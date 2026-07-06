/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Coordinate {
  xCoordinate: number;
  yCoordinate: number;
}

export type Unit = 'px' | '%' | 'rem';

export type CommandType = 'from' | 'line' | 'hline' | 'vline' | 'curve' | 'arc' | 'close';

export interface BaseCommand {
  identifier: string;
  type: CommandType;
}

export interface FromCommand extends BaseCommand {
  type: 'from';
  xCoordinate: number;
  yCoordinate: number;
  horizontalUnit: Unit;
  verticalUnit: Unit;
}

export interface LineCommand extends BaseCommand {
  type: 'line';
  syntaxModifier: 'to' | 'by';
  xCoordinate: number;
  yCoordinate: number;
  horizontalUnit: Unit;
  verticalUnit: Unit;
}

export interface HorizontalLineCommand extends BaseCommand {
  type: 'hline';
  syntaxModifier: 'to' | 'by';
  value: number;
  unit: Unit;
}

export interface VerticalLineCommand extends BaseCommand {
  type: 'vline';
  syntaxModifier: 'to' | 'by';
  value: number;
  unit: Unit;
}

export interface CurveCommand extends BaseCommand {
  type: 'curve';
  syntaxModifier: 'to' | 'by';
  xCoordinate: number;
  yCoordinate: number;
  horizontalUnit: Unit;
  verticalUnit: Unit;
  firstControlCircle: Coordinate;
  firstControlHorizontalUnit: Unit;
  firstControlVerticalUnit: Unit;
  hasSecondControlCircle: boolean;
  secondControlCircle: Coordinate;
  secondControlHorizontalUnit: Unit;
  secondControlVerticalUnit: Unit;
}

export interface ArcCommand extends BaseCommand {
  type: 'arc';
  syntaxModifier: 'to' | 'by';
  xCoordinate: number;
  yCoordinate: number;
  horizontalUnit: Unit;
  verticalUnit: Unit;
  radiusX: number;
  radiusXUnit: Unit;
  radiusY: number;
  radiusYUnit: Unit;
  arcSize: 'large' | 'small';
  sweepDirection: 'cw' | 'ccw';
  rotationAngle: number;
}

export interface CloseCommand extends BaseCommand {
  type: 'close';
}

export type ShapeCommand =
  | FromCommand
  | LineCommand
  | HorizontalLineCommand
  | VerticalLineCommand
  | CurveCommand
  | ArcCommand
  | CloseCommand;

export interface ShapePreset {
  name: string;
  description: string;
  commands: ShapeCommand[];
}
