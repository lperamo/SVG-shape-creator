/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Coordinate,
  Unit,
  CommandType,
  ShapeCommand,
  FromCommand,
  ShapePreset
} from './types.js';
import { state } from './state.js';
import {
  adjustClippedElementScale,
  computeWholeCoordinatesMatrix,
  handleCanvasDoubleClick,
  updateVisualClippedLayoutAndCanvas
} from './canvas.js';
import {
  setFocusedActiveCommand,
  stableRebuildCommandsSidebarDOM
} from './sidebar.js';
import {
  computeLogicalCoordinates,
  convertPixelsToUnit,
  convertUnitToPixels
} from './conversions.js';
import {
  compileCSSAnimationCodeString,
  compileShapeCodeString
} from './compiler.js';
import {
  presetLocalizations,
  translatePageHTML
} from './localization.js';

// Importing the SCSS style to let Vite understand it natively
import '../scss/pages/editor/editor.scss';

// Custom presets loaded into application memory
export const shapePresets: ShapePreset[] = [
  {
    name: 'Bulle de discussion',
    description: 'La bulle emblématique de Lionel Péramo avec bords courbes.',
    commands: [
      { identifier: 'cmd-1', type: 'from', xCoordinate: 40, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-2', type: 'hline', syntaxModifier: 'to', value: 360, unit: 'px' },
      { identifier: 'cmd-3', type: 'curve', syntaxModifier: 'to', xCoordinate: 380, yCoordinate: 60, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 380, yCoordinate: 40 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: false, secondControlCircle: { xCoordinate: 0, yCoordinate: 0 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-4', type: 'vline', syntaxModifier: 'to', value: 240, unit: 'px' },
      { identifier: 'cmd-5', type: 'curve', syntaxModifier: 'to', xCoordinate: 360, yCoordinate: 260, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 380, yCoordinate: 260 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: false, secondControlCircle: { xCoordinate: 0, yCoordinate: 0 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-6', type: 'hline', syntaxModifier: 'to', value: 160, unit: 'px' },
      { identifier: 'cmd-7', type: 'line', syntaxModifier: 'to', xCoordinate: 100, yCoordinate: 320, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-8', type: 'line', syntaxModifier: 'to', xCoordinate: 130, yCoordinate: 260, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-9', type: 'hline', syntaxModifier: 'to', value: 40, unit: 'px' },
      { identifier: 'cmd-10', type: 'curve', syntaxModifier: 'to', xCoordinate: 20, yCoordinate: 240, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 20, yCoordinate: 260 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: false, secondControlCircle: { xCoordinate: 0, yCoordinate: 0 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-11', type: 'vline', syntaxModifier: 'to', value: 60, unit: 'px' },
      { identifier: 'cmd-12', type: 'curve', syntaxModifier: 'to', xCoordinate: 40, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 20, yCoordinate: 40 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: false, secondControlCircle: { xCoordinate: 0, yCoordinate: 0 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-13', type: 'close' }
    ]
  },
  {
    name: 'Cœur Sacré',
    description: 'Dessin romantique à l\'aide de deux courbes de Bézier cubiques.',
    commands: [
      { identifier: 'cmd-101', type: 'from', xCoordinate: 200, yCoordinate: 100, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-102', type: 'curve', syntaxModifier: 'to', xCoordinate: 360, yCoordinate: 180, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 200, yCoordinate: 40 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: true, secondControlCircle: { xCoordinate: 360, yCoordinate: 80 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-103', type: 'line', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 340, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-104', type: 'line', syntaxModifier: 'to', xCoordinate: 40, yCoordinate: 180, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-105', type: 'curve', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 100, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 40, yCoordinate: 80 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: true, secondControlCircle: { xCoordinate: 200, yCoordinate: 40 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-106', type: 'close' }
    ]
  },
  {
    name: 'Étoile à 5 branches',
    description: 'Une forme géométrique asymétrique découpée en polygones.',
    commands: [
      { identifier: 'cmd-201', type: 'from', xCoordinate: 200, yCoordinate: 20, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-202', type: 'line', syntaxModifier: 'to', xCoordinate: 250, yCoordinate: 140, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-203', type: 'line', syntaxModifier: 'to', xCoordinate: 380, yCoordinate: 140, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-204', type: 'line', syntaxModifier: 'to', xCoordinate: 270, yCoordinate: 220, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-205', type: 'line', syntaxModifier: 'to', xCoordinate: 310, yCoordinate: 350, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-206', type: 'line', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 270, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-207', type: 'line', syntaxModifier: 'to', xCoordinate: 90, yCoordinate: 350, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-208', type: 'line', syntaxModifier: 'to', xCoordinate: 130, yCoordinate: 220, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-209', type: 'line', syntaxModifier: 'to', xCoordinate: 20, yCoordinate: 140, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-210', type: 'line', syntaxModifier: 'to', xCoordinate: 150, yCoordinate: 140, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-211', type: 'close' }
    ]
  },
  {
    name: 'Bouclier National',
    description: 'Une forme majestueuse combinant lignes droites et arrondies.',
    commands: [
      { identifier: 'cmd-301', type: 'from', xCoordinate: 200, yCoordinate: 45, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-302', type: 'hline', syntaxModifier: 'to', value: 340, unit: 'px' },
      { identifier: 'cmd-303', type: 'curve', syntaxModifier: 'to', xCoordinate: 360, yCoordinate: 100, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 360, yCoordinate: 45 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: false, secondControlCircle: { xCoordinate: 0, yCoordinate: 0 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-304', type: 'vline', syntaxModifier: 'to', value: 220, unit: 'px' },
      { identifier: 'cmd-305', type: 'curve', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 370, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 360, yCoordinate: 300 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: false, secondControlCircle: { xCoordinate: 0, yCoordinate: 0 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-306', type: 'curve', syntaxModifier: 'to', xCoordinate: 40, yCoordinate: 220, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 40, yCoordinate: 300 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: false, secondControlCircle: { xCoordinate: 0, yCoordinate: 0 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-307', type: 'vline', syntaxModifier: 'to', value: 100, unit: 'px' },
      { identifier: 'cmd-308', type: 'curve', syntaxModifier: 'to', xCoordinate: 60, yCoordinate: 45, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 40, yCoordinate: 45 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: false, secondControlCircle: { xCoordinate: 0, yCoordinate: 0 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-309', type: 'close' }
    ]
  },
  {
    name: 'Bannière Vague',
    description: 'Magnifique en-tête horizontal découpé avec une double ondulation.',
    commands: [
      { identifier: 'cmd-401', type: 'from', xCoordinate: 0, yCoordinate: 0, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-402', type: 'hline', syntaxModifier: 'to', value: 400, unit: 'px' },
      { identifier: 'cmd-403', type: 'vline', syntaxModifier: 'to', value: 240, unit: 'px' },
      { identifier: 'cmd-404', type: 'curve', syntaxModifier: 'to', xCoordinate: 0, yCoordinate: 280, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 300, yCoordinate: 150 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: true, secondControlCircle: { xCoordinate: 100, yCoordinate: 360 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-405', type: 'close' }
    ]
  },
  {
    name: 'Badge Octogonal',
    description: 'Une plaque géométrique stricte à huit côtés égale.',
    commands: [
      { identifier: 'cmd-501', type: 'from', xCoordinate: 110, yCoordinate: 30, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-502', type: 'hline', syntaxModifier: 'to', value: 290, unit: 'px' },
      { identifier: 'cmd-503', type: 'line', syntaxModifier: 'to', xCoordinate: 370, yCoordinate: 110, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-504', type: 'vline', syntaxModifier: 'to', value: 290, unit: 'px' },
      { identifier: 'cmd-505', type: 'line', syntaxModifier: 'to', xCoordinate: 290, yCoordinate: 370, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-506', type: 'hline', syntaxModifier: 'to', value: 110, unit: 'px' },
      { identifier: 'cmd-507', type: 'line', syntaxModifier: 'to', xCoordinate: 30, yCoordinate: 290, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-508', type: 'vline', syntaxModifier: 'to', value: 110, unit: 'px' },
      { identifier: 'cmd-509', type: 'close' }
    ]
  },
  {
    name: 'Goutte d\'eau',
    description: 'Une forme en larme dessinée avec des courbes de Bézier lisses symétriques.',
    commands: [
      { identifier: 'cmd-601', type: 'from', xCoordinate: 200, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-602', type: 'curve', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 340, yCoordinate: 160 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: true, secondControlCircle: { xCoordinate: 340, yCoordinate: 360 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-603', type: 'curve', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 60, yCoordinate: 360 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: true, secondControlCircle: { xCoordinate: 60, yCoordinate: 160 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-604', type: 'close' }
    ]
  },
  {
    name: 'Croissant de lune',
    description: 'Un contour de lune élégant assemblé avec deux courbes de Bézier s\'entrecroisant.',
    commands: [
      { identifier: 'cmd-701', type: 'from', xCoordinate: 280, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-702', type: 'curve', syntaxModifier: 'to', xCoordinate: 280, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 100, yCoordinate: 100 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: true, secondControlCircle: { xCoordinate: 100, yCoordinate: 300 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-703', type: 'curve', syntaxModifier: 'to', xCoordinate: 280, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 180, yCoordinate: 280 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: true, secondControlCircle: { xCoordinate: 180, yCoordinate: 120 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-704', type: 'close' }
    ]
  },
  {
    name: 'Signe Infini',
    description: 'Un double nœud de courbe fluide représentant l\'éternité géométrique.',
    commands: [
      { identifier: 'cmd-801', type: 'from', xCoordinate: 200, yCoordinate: 200, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-802', type: 'curve', syntaxModifier: 'to', xCoordinate: 350, yCoordinate: 120, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 250, yCoordinate: 120 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: true, secondControlCircle: { xCoordinate: 310, yCoordinate: 120 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-803', type: 'curve', syntaxModifier: 'to', xCoordinate: 350, yCoordinate: 280, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 390, yCoordinate: 120 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: true, secondControlCircle: { xCoordinate: 390, yCoordinate: 280 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-804', type: 'curve', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 200, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 310, yCoordinate: 280 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: true, secondControlCircle: { xCoordinate: 250, yCoordinate: 280 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-805', type: 'curve', syntaxModifier: 'to', xCoordinate: 50, yCoordinate: 120, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 150, yCoordinate: 120 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: true, secondControlCircle: { xCoordinate: 90, yCoordinate: 120 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-806', type: 'curve', syntaxModifier: 'to', xCoordinate: 50, yCoordinate: 280, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 10, yCoordinate: 120 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: true, secondControlCircle: { xCoordinate: 10, yCoordinate: 280 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-807', type: 'curve', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 200, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 90, yCoordinate: 280 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: true, secondControlCircle: { xCoordinate: 150, yCoordinate: 280 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-808', type: 'close' }
    ]
  },
  {
    name: 'Sablier Classique',
    description: 'Une silhouette de sablier associant lignes droites et courbes intérieures.',
    commands: [
      { identifier: 'cmd-901', type: 'from', xCoordinate: 80, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-902', type: 'hline', syntaxModifier: 'to', value: 320, unit: 'px' },
      { identifier: 'cmd-903', type: 'curve', syntaxModifier: 'to', xCoordinate: 320, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 220, yCoordinate: 200 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: false, secondControlCircle: { xCoordinate: 0, yCoordinate: 0 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-904', type: 'hline', syntaxModifier: 'to', value: 80, unit: 'px' },
      { identifier: 'cmd-905', type: 'curve', syntaxModifier: 'to', xCoordinate: 80, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px', firstControlCircle: { xCoordinate: 180, yCoordinate: 200 }, firstControlHorizontalUnit: 'px', firstControlVerticalUnit: 'px', hasSecondControlCircle: false, secondControlCircle: { xCoordinate: 0, yCoordinate: 0 }, secondControlHorizontalUnit: 'px', secondControlVerticalUnit: 'px' },
      { identifier: 'cmd-906', type: 'close' }
    ]
  },
  {
    name: 'Éclipse Solaire',
    description: 'Un superbe tracé utilisant la puissance de la commande arc elliptique.',
    commands: [
      { identifier: 'cmd-1001', type: 'from', xCoordinate: 310, yCoordinate: 90, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-1002', type: 'arc', syntaxModifier: 'to', xCoordinate: 90, yCoordinate: 310, horizontalUnit: 'px', verticalUnit: 'px', radiusX: 160, radiusXUnit: 'px', radiusY: 160, radiusYUnit: 'px', arcSize: 'small', sweepDirection: 'ccw', rotationAngle: 0 },
      { identifier: 'cmd-1003', type: 'arc', syntaxModifier: 'to', xCoordinate: 310, yCoordinate: 90, horizontalUnit: 'px', verticalUnit: 'px', radiusX: 130, radiusXUnit: 'px', radiusY: 130, radiusYUnit: 'px', arcSize: 'small', sweepDirection: 'cw', rotationAngle: 0 },
      { identifier: 'cmd-1004', type: 'close' }
    ]
  },
  {
    name: 'Triangle',
    description: 'A basic 3-sided polygon with clean coordinates.',
    commands: [
      { identifier: 'cmd-t1', type: 'from', xCoordinate: 200, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-t2', type: 'line', syntaxModifier: 'to', xCoordinate: 360, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-t3', type: 'line', syntaxModifier: 'to', xCoordinate: 40, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-t4', type: 'close' }
    ]
  },
  {
    name: 'Trapezoid',
    description: 'A classic 4-sided trapezoid symmetric silhouette.',
    commands: [
      { identifier: 'cmd-tz1', type: 'from', xCoordinate: 120, yCoordinate: 60, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-tz2', type: 'hline', syntaxModifier: 'to', value: 280, unit: 'px' },
      { identifier: 'cmd-tz3', type: 'line', syntaxModifier: 'to', xCoordinate: 340, yCoordinate: 340, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-tz4', type: 'hline', syntaxModifier: 'to', value: 60, unit: 'px' },
      { identifier: 'cmd-tz5', type: 'close' }
    ]
  },
  {
    name: 'Parallelogram',
    description: 'An elegant tilted 4-sided parallelogram shape.',
    commands: [
      { identifier: 'cmd-pa1', type: 'from', xCoordinate: 120, yCoordinate: 60, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-pa2', type: 'hline', syntaxModifier: 'to', value: 360, unit: 'px' },
      { identifier: 'cmd-pa3', type: 'line', syntaxModifier: 'to', xCoordinate: 280, yCoordinate: 340, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-pa4', type: 'hline', syntaxModifier: 'to', value: 40, unit: 'px' },
      { identifier: 'cmd-pa5', type: 'close' }
    ]
  },
  {
    name: 'Rhombus',
    description: 'A perfectly balanced diamond or rhombus shape.',
    commands: [
      { identifier: 'cmd-rh1', type: 'from', xCoordinate: 200, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-rh2', type: 'line', syntaxModifier: 'to', xCoordinate: 360, yCoordinate: 200, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-rh3', type: 'line', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-rh4', type: 'line', syntaxModifier: 'to', xCoordinate: 40, yCoordinate: 200, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-rh5', type: 'close' }
    ]
  },
  {
    name: 'Pentagon',
    description: 'A five-sided regular polygon silhouette.',
    commands: [
      { identifier: 'cmd-pe1', type: 'from', xCoordinate: 200, yCoordinate: 30, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-pe2', type: 'line', syntaxModifier: 'to', xCoordinate: 362, yCoordinate: 148, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-pe3', type: 'line', syntaxModifier: 'to', xCoordinate: 300, yCoordinate: 338, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-pe4', type: 'line', syntaxModifier: 'to', xCoordinate: 100, yCoordinate: 338, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-pe5', type: 'line', syntaxModifier: 'to', xCoordinate: 38, yCoordinate: 148, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-pe6', type: 'close' }
    ]
  },
  {
    name: 'Hexagon',
    description: 'A six-sided standard symmetrical polygon.',
    commands: [
      { identifier: 'cmd-hx1', type: 'from', xCoordinate: 200, yCoordinate: 30, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-hx2', type: 'line', syntaxModifier: 'to', xCoordinate: 347, yCoordinate: 115, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-hx3', type: 'line', syntaxModifier: 'to', xCoordinate: 347, yCoordinate: 285, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-hx4', type: 'line', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 370, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-hx5', type: 'line', syntaxModifier: 'to', xCoordinate: 53, yCoordinate: 285, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-hx6', type: 'line', syntaxModifier: 'to', xCoordinate: 53, yCoordinate: 115, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-hx7', type: 'close' }
    ]
  },
  {
    name: 'Heptagon',
    description: 'A seven-sided polygon with calculated corners.',
    commands: [
      { identifier: 'cmd-hp1', type: 'from', xCoordinate: 200, yCoordinate: 30, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-hp2', type: 'line', syntaxModifier: 'to', xCoordinate: 325, yCoordinate: 90, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-hp3', type: 'line', syntaxModifier: 'to', xCoordinate: 368, yCoordinate: 222, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-hp4', type: 'line', syntaxModifier: 'to', xCoordinate: 278, yCoordinate: 345, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-hp5', type: 'line', syntaxModifier: 'to', xCoordinate: 122, yCoordinate: 345, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-hp6', type: 'line', syntaxModifier: 'to', xCoordinate: 32, yCoordinate: 222, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-hp7', type: 'line', syntaxModifier: 'to', xCoordinate: 75, yCoordinate: 90, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-hp8', type: 'close' }
    ]
  },
  {
    name: 'Octagon',
    description: 'A symmetrical eight-sided polygon shape.',
    commands: [
      { identifier: 'cmd-oc1', type: 'from', xCoordinate: 130, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-oc2', type: 'hline', syntaxModifier: 'to', value: 270, unit: 'px' },
      { identifier: 'cmd-oc3', type: 'line', syntaxModifier: 'to', xCoordinate: 360, yCoordinate: 130, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-oc4', type: 'vline', syntaxModifier: 'to', value: 270, unit: 'px' },
      { identifier: 'cmd-oc5', type: 'line', syntaxModifier: 'to', xCoordinate: 270, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-oc6', type: 'hline', syntaxModifier: 'to', value: 130, unit: 'px' },
      { identifier: 'cmd-oc7', type: 'line', syntaxModifier: 'to', xCoordinate: 40, yCoordinate: 270, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-oc8', type: 'vline', syntaxModifier: 'to', value: 130, unit: 'px' },
      { identifier: 'cmd-oc9', type: 'close' }
    ]
  },
  {
    name: 'Nonagon',
    description: 'A complex nine-sided symmetrical polygon.',
    commands: [
      { identifier: 'cmd-nn1', type: 'from', xCoordinate: 200, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-nn2', type: 'line', syntaxModifier: 'to', xCoordinate: 303, yCoordinate: 77, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-nn3', type: 'line', syntaxModifier: 'to', xCoordinate: 358, yCoordinate: 172, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-nn4', type: 'line', syntaxModifier: 'to', xCoordinate: 339, yCoordinate: 280, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-nn5', type: 'line', syntaxModifier: 'to', xCoordinate: 255, yCoordinate: 350, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-nn6', type: 'line', syntaxModifier: 'to', xCoordinate: 145, yCoordinate: 350, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-nn7', type: 'line', syntaxModifier: 'to', xCoordinate: 61, yCoordinate: 280, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-nn8', type: 'line', syntaxModifier: 'to', xCoordinate: 42, yCoordinate: 172, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-nn9', type: 'line', syntaxModifier: 'to', xCoordinate: 97, yCoordinate: 77, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-nn10', type: 'close' }
    ]
  },
  {
    name: 'Decagon',
    description: 'A highly structured ten-sided symmetrical polygon.',
    commands: [
      { identifier: 'cmd-dc1', type: 'from', xCoordinate: 200, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-dc2', type: 'line', syntaxModifier: 'to', xCoordinate: 294, yCoordinate: 71, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-dc3', type: 'line', syntaxModifier: 'to', xCoordinate: 352, yCoordinate: 151, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-dc4', type: 'line', syntaxModifier: 'to', xCoordinate: 352, yCoordinate: 249, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-dc5', type: 'line', syntaxModifier: 'to', xCoordinate: 294, yCoordinate: 329, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-dc6', type: 'line', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-dc7', type: 'line', syntaxModifier: 'to', xCoordinate: 106, yCoordinate: 329, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-dc8', type: 'line', syntaxModifier: 'to', xCoordinate: 48, yCoordinate: 249, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-dc9', type: 'line', syntaxModifier: 'to', xCoordinate: 48, yCoordinate: 151, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-dc10', type: 'line', syntaxModifier: 'to', xCoordinate: 106, yCoordinate: 71, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-dc11', type: 'close' }
    ]
  },
  {
    name: 'Bevel',
    description: 'A square layout element cut symmetrically at every corner.',
    commands: [
      { identifier: 'cmd-bv1', type: 'from', xCoordinate: 80, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-bv2', type: 'hline', syntaxModifier: 'to', value: 320, unit: 'px' },
      { identifier: 'cmd-bv3', type: 'line', syntaxModifier: 'to', xCoordinate: 360, yCoordinate: 80, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-bv4', type: 'vline', syntaxModifier: 'to', value: 320, unit: 'px' },
      { identifier: 'cmd-bv5', type: 'line', syntaxModifier: 'to', xCoordinate: 320, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-bv6', type: 'hline', syntaxModifier: 'to', value: 80, unit: 'px' },
      { identifier: 'cmd-bv7', type: 'line', syntaxModifier: 'to', xCoordinate: 40, yCoordinate: 320, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-bv8', type: 'vline', syntaxModifier: 'to', value: 80, unit: 'px' },
      { identifier: 'cmd-bv9', type: 'close' }
    ]
  },
  {
    name: 'Rabbet',
    description: 'A decorative notched-corner geometric frame shape.',
    commands: [
      { identifier: 'cmd-rb1', type: 'from', xCoordinate: 80, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-rb2', type: 'hline', syntaxModifier: 'to', value: 320, unit: 'px' },
      { identifier: 'cmd-rb3', type: 'vline', syntaxModifier: 'to', value: 80, unit: 'px' },
      { identifier: 'cmd-rb4', type: 'hline', syntaxModifier: 'to', value: 360, unit: 'px' },
      { identifier: 'cmd-rb5', type: 'vline', syntaxModifier: 'to', value: 320, unit: 'px' },
      { identifier: 'cmd-rb6', type: 'hline', syntaxModifier: 'to', value: 320, unit: 'px' },
      { identifier: 'cmd-rb7', type: 'vline', syntaxModifier: 'to', value: 360, unit: 'px' },
      { identifier: 'cmd-rb8', type: 'hline', syntaxModifier: 'to', value: 80, unit: 'px' },
      { identifier: 'cmd-rb9', type: 'vline', syntaxModifier: 'to', value: 320, unit: 'px' },
      { identifier: 'cmd-rb10', type: 'hline', syntaxModifier: 'to', value: 40, unit: 'px' },
      { identifier: 'cmd-rb11', type: 'vline', syntaxModifier: 'to', value: 80, unit: 'px' },
      { identifier: 'cmd-rb12', type: 'hline', syntaxModifier: 'to', value: 80, unit: 'px' },
      { identifier: 'cmd-rb13', type: 'close' }
    ]
  },
  {
    name: 'Left arrow',
    description: 'A classic signaling arrow pointing to the left.',
    commands: [
      { identifier: 'cmd-la1', type: 'from', xCoordinate: 180, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-la2', type: 'line', syntaxModifier: 'to', xCoordinate: 40, yCoordinate: 200, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-la3', type: 'line', syntaxModifier: 'to', xCoordinate: 180, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-la4', type: 'vline', syntaxModifier: 'to', value: 280, unit: 'px' },
      { identifier: 'cmd-la5', type: 'hline', syntaxModifier: 'to', value: 360, unit: 'px' },
      { identifier: 'cmd-la6', type: 'vline', syntaxModifier: 'to', value: 120, unit: 'px' },
      { identifier: 'cmd-la7', type: 'hline', syntaxModifier: 'to', value: 180, unit: 'px' },
      { identifier: 'cmd-la8', type: 'close' }
    ]
  },
  {
    name: 'Right arrow',
    description: 'A standard signaling arrow pointing to the right.',
    commands: [
      { identifier: 'cmd-ra1', type: 'from', xCoordinate: 40, yCoordinate: 120, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-ra2', type: 'hline', syntaxModifier: 'to', value: 220, unit: 'px' },
      { identifier: 'cmd-ra3', type: 'vline', syntaxModifier: 'to', value: 40, unit: 'px' },
      { identifier: 'cmd-ra4', type: 'line', syntaxModifier: 'to', xCoordinate: 360, yCoordinate: 200, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-ra5', type: 'line', syntaxModifier: 'to', xCoordinate: 220, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-ra6', type: 'vline', syntaxModifier: 'to', value: 280, unit: 'px' },
      { identifier: 'cmd-ra7', type: 'hline', syntaxModifier: 'to', value: 40, unit: 'px' },
      { identifier: 'cmd-ra8', type: 'close' }
    ]
  },
  {
    name: 'Left Point',
    description: 'A layout tag displaying a clean pointed tip on its left edge.',
    commands: [
      { identifier: 'cmd-lp1', type: 'from', xCoordinate: 160, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-lp2', type: 'hline', syntaxModifier: 'to', value: 360, unit: 'px' },
      { identifier: 'cmd-lp3', type: 'vline', syntaxModifier: 'to', value: 360, unit: 'px' },
      { identifier: 'cmd-lp4', type: 'hline', syntaxModifier: 'to', value: 160, unit: 'px' },
      { identifier: 'cmd-lp5', type: 'line', syntaxModifier: 'to', xCoordinate: 40, yCoordinate: 200, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-lp6', type: 'close' }
    ]
  },
  {
    name: 'Right Point',
    description: 'A layout tag displaying a clean pointed tip on its right edge.',
    commands: [
      { identifier: 'cmd-rp1', type: 'from', xCoordinate: 40, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-rp2', type: 'hline', syntaxModifier: 'to', value: 240, unit: 'px' },
      { identifier: 'cmd-rp3', type: 'line', syntaxModifier: 'to', xCoordinate: 360, yCoordinate: 200, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-rp4', type: 'line', syntaxModifier: 'to', xCoordinate: 240, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-rp5', type: 'hline', syntaxModifier: 'to', value: 40, unit: 'px' },
      { identifier: 'cmd-rp6', type: 'close' }
    ]
  },
  {
    name: 'Left Chevron',
    description: 'A navigation chevron block pointing to the left.',
    commands: [
      { identifier: 'cmd-lc1', type: 'from', xCoordinate: 180, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-lc2', type: 'line', syntaxModifier: 'to', xCoordinate: 40, yCoordinate: 200, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-lc3', type: 'line', syntaxModifier: 'to', xCoordinate: 180, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-lc4', type: 'hline', syntaxModifier: 'to', value: 320, unit: 'px' },
      { identifier: 'cmd-lc5', type: 'line', syntaxModifier: 'to', xCoordinate: 180, yCoordinate: 200, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-lc6', type: 'line', syntaxModifier: 'to', xCoordinate: 320, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-lc7', type: 'close' }
    ]
  },
  {
    name: 'Right Chevron',
    description: 'A navigation chevron block pointing to the right.',
    commands: [
      { identifier: 'cmd-rc1', type: 'from', xCoordinate: 80, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-rc2', type: 'line', syntaxModifier: 'to', xCoordinate: 220, yCoordinate: 200, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-rc3', type: 'line', syntaxModifier: 'to', xCoordinate: 80, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-rc4', type: 'hline', syntaxModifier: 'to', value: 220, unit: 'px' },
      { identifier: 'cmd-rc5', type: 'line', syntaxModifier: 'to', xCoordinate: 360, yCoordinate: 200, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-rc6', type: 'line', syntaxModifier: 'to', xCoordinate: 220, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-rc7', type: 'close' }
    ]
  },
  {
    name: 'Cross',
    description: 'A classic symmetrical cross structure geometric layout.',
    commands: [
      { identifier: 'cmd-cr1', type: 'from', xCoordinate: 160, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-cr2', type: 'hline', syntaxModifier: 'to', value: 240, unit: 'px' },
      { identifier: 'cmd-cr3', type: 'vline', syntaxModifier: 'to', value: 140, unit: 'px' },
      { identifier: 'cmd-cr4', type: 'hline', syntaxModifier: 'to', value: 340, unit: 'px' },
      { identifier: 'cmd-cr5', type: 'vline', syntaxModifier: 'to', value: 220, unit: 'px' },
      { identifier: 'cmd-cr6', type: 'hline', syntaxModifier: 'to', value: 240, unit: 'px' },
      { identifier: 'cmd-cr7', type: 'vline', syntaxModifier: 'to', value: 360, unit: 'px' },
      { identifier: 'cmd-cr8', type: 'hline', syntaxModifier: 'to', value: 160, unit: 'px' },
      { identifier: 'cmd-cr9', type: 'vline', syntaxModifier: 'to', value: 220, unit: 'px' },
      { identifier: 'cmd-cr10', type: 'hline', syntaxModifier: 'to', value: 60, unit: 'px' },
      { identifier: 'cmd-cr11', type: 'vline', syntaxModifier: 'to', value: 140, unit: 'px' },
      { identifier: 'cmd-cr12', type: 'hline', syntaxModifier: 'to', value: 160, unit: 'px' },
      { identifier: 'cmd-cr13', type: 'close' }
    ]
  },
  {
    name: 'Message',
    description: 'A sleek chat balloon with a pointed conversational indicator tail.',
    commands: [
      { identifier: 'cmd-msg1', type: 'from', xCoordinate: 40, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-msg2', type: 'hline', syntaxModifier: 'to', value: 360, unit: 'px' },
      { identifier: 'cmd-msg3', type: 'vline', syntaxModifier: 'to', value: 280, unit: 'px' },
      { identifier: 'cmd-msg4', type: 'hline', syntaxModifier: 'to', value: 120, unit: 'px' },
      { identifier: 'cmd-msg5', type: 'line', syntaxModifier: 'to', xCoordinate: 40, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-msg6', type: 'vline', syntaxModifier: 'to', value: 280, unit: 'px' },
      { identifier: 'cmd-msg7', type: 'close' }
    ]
  },
  {
    name: 'Close',
    description: 'The iconic standard close multiplication \'X\' structure.',
    commands: [
      { identifier: 'cmd-cl1', type: 'from', xCoordinate: 120, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-cl2', type: 'line', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 120, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-cl3', type: 'line', syntaxModifier: 'to', xCoordinate: 280, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-cl4', type: 'line', syntaxModifier: 'to', xCoordinate: 360, yCoordinate: 120, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-cl5', type: 'line', syntaxModifier: 'to', xCoordinate: 280, yCoordinate: 200, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-cl6', type: 'line', syntaxModifier: 'to', xCoordinate: 360, yCoordinate: 280, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-cl7', type: 'line', syntaxModifier: 'to', xCoordinate: 280, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-cl8', type: 'line', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 280, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-cl9', type: 'line', syntaxModifier: 'to', xCoordinate: 120, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-cl10', type: 'line', syntaxModifier: 'to', xCoordinate: 40, yCoordinate: 280, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-cl11', type: 'line', syntaxModifier: 'to', xCoordinate: 120, yCoordinate: 200, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-cl12', type: 'line', syntaxModifier: 'to', xCoordinate: 40, yCoordinate: 120, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-cl13', type: 'close' }
    ]
  },
  {
    name: 'Frame',
    description: 'A beautiful hollow double frame using a single nested outline path.',
    commands: [
      { identifier: 'cmd-fr1', type: 'from', xCoordinate: 40, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-fr2', type: 'hline', syntaxModifier: 'to', value: 360, unit: 'px' },
      { identifier: 'cmd-fr3', type: 'vline', syntaxModifier: 'to', value: 360, unit: 'px' },
      { identifier: 'cmd-fr4', type: 'hline', syntaxModifier: 'to', value: 40, unit: 'px' },
      { identifier: 'cmd-fr5', type: 'vline', syntaxModifier: 'to', value: 80, unit: 'px' },
      { identifier: 'cmd-fr6', type: 'hline', syntaxModifier: 'to', value: 80, unit: 'px' },
      { identifier: 'cmd-fr7', type: 'vline', syntaxModifier: 'to', value: 320, unit: 'px' },
      { identifier: 'cmd-fr8', type: 'hline', syntaxModifier: 'to', value: 320, unit: 'px' },
      { identifier: 'cmd-fr9', type: 'vline', syntaxModifier: 'to', value: 80, unit: 'px' },
      { identifier: 'cmd-fr10', type: 'hline', syntaxModifier: 'to', value: 80, unit: 'px' },
      { identifier: 'cmd-fr11', type: 'vline', syntaxModifier: 'to', value: 40, unit: 'px' },
      { identifier: 'cmd-fr12', type: 'close' }
    ]
  },
  {
    name: 'Inset',
    description: 'A centered, smaller rectangular viewport structure.',
    commands: [
      { identifier: 'cmd-in1', type: 'from', xCoordinate: 80, yCoordinate: 80, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-in2', type: 'hline', syntaxModifier: 'to', value: 320, unit: 'px' },
      { identifier: 'cmd-in3', type: 'vline', syntaxModifier: 'to', value: 320, unit: 'px' },
      { identifier: 'cmd-in4', type: 'hline', syntaxModifier: 'to', value: 80, unit: 'px' },
      { identifier: 'cmd-in5', type: 'close' }
    ]
  },
  {
    name: 'Circle',
    description: 'A perfect circular alignment built using dual elliptical arc commands.',
    commands: [
      { identifier: 'cmd-ci1', type: 'from', xCoordinate: 200, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-ci2', type: 'arc', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 360, horizontalUnit: 'px', verticalUnit: 'px', radiusX: 160, radiusXUnit: 'px', radiusY: 160, radiusYUnit: 'px', arcSize: 'large', sweepDirection: 'cw', rotationAngle: 0 },
      { identifier: 'cmd-ci3', type: 'arc', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 40, horizontalUnit: 'px', verticalUnit: 'px', radiusX: 160, radiusXUnit: 'px', radiusY: 160, radiusYUnit: 'px', arcSize: 'large', sweepDirection: 'cw', rotationAngle: 0 },
      { identifier: 'cmd-ci4', type: 'close' }
    ]
  },
  {
    name: 'Ellipse',
    description: 'A beautifully balanced ellipse stretched over offset semi-axes.',
    commands: [
      { identifier: 'cmd-el1', type: 'from', xCoordinate: 200, yCoordinate: 70, horizontalUnit: 'px', verticalUnit: 'px' },
      { identifier: 'cmd-el2', type: 'arc', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 330, horizontalUnit: 'px', verticalUnit: 'px', radiusX: 100, radiusXUnit: 'px', radiusY: 130, radiusYUnit: 'px', arcSize: 'large', sweepDirection: 'cw', rotationAngle: 0 },
      { identifier: 'cmd-el3', type: 'arc', syntaxModifier: 'to', xCoordinate: 200, yCoordinate: 70, horizontalUnit: 'px', verticalUnit: 'px', radiusX: 100, radiusXUnit: 'px', radiusY: 130, radiusYUnit: 'px', arcSize: 'large', sweepDirection: 'cw', rotationAngle: 0 },
      { identifier: 'cmd-el4', type: 'close' }
    ]
  }
];

export function deepDuplicateStack(commands: ShapeCommand[]): ShapeCommand[]
{
  return JSON.parse(JSON.stringify(commands));
}

export function loadSelectedPresetTemplate(preset: ShapePreset): void
{
  state.commandsStack = deepDuplicateStack(preset.commands);
  state.selectedCommandIdentifier = state.commandsStack[0].identifier;

  state.initialStateCommands = null;
  state.finalStateCommands = null;
  refreshAnimationIndicatorsUI();

  stableRebuildCommandsSidebarDOM();
  updateVisualClippedLayoutAndCanvas();
  renderPresetButtonCardsList();

  const presetName = presetLocalizations[state.currentLanguage][shapePresets.indexOf(preset)]?.name || preset.name;

  announceToScreenReader(state.currentLanguage === 'en'
    ? `Preset loaded: ${presetName}`
    : `Préréglage chargé : ${presetName}`
  );

  toggleCollapsibleSection('commandsCard', 'expand');
}

export function createAndAppendCommandBlock(type: CommandType): void
{
  const newIdentifier = `cmd-user-${Date.now()}`;
  let newCommand: ShapeCommand;

  toggleCollapsibleSection('commandsCard', 'expand');

  let insertIndex = -1;

  if (state.selectedCommandIdentifier)
    insertIndex = state.commandsStack.findIndex((commandItem: ShapeCommand) => commandItem.identifier === state.selectedCommandIdentifier);

  const matrix = computeWholeCoordinatesMatrix(state.commandsStack);
  let previousPoint: Coordinate;

  if (insertIndex !== -1 && insertIndex < matrix.length)
    previousPoint = matrix[insertIndex].absoluteEnd;
  else if (matrix.length > 0)
    previousPoint = matrix[matrix.length - 1].absoluteEnd;
  else
    previousPoint = { xCoordinate: 100, yCoordinate: 100 };

  const
    derivedX = Math.round(Math.min(360, Math.max(40, previousPoint.xCoordinate + 40))),
    derivedY = Math.round(Math.min(360, Math.max(40, previousPoint.yCoordinate + 40)));

  switch (type)
  {
    case 'from':
      newCommand = {
        identifier: newIdentifier,
        type: 'from',
        xCoordinate: derivedX,
        yCoordinate: derivedY,
        horizontalUnit: 'px',
        verticalUnit: 'px'
      };
      break;
    case 'line':
      newCommand = {
        identifier: newIdentifier,
        type: 'line',
        syntaxModifier: 'to',
        xCoordinate: derivedX,
        yCoordinate: derivedY,
        horizontalUnit: 'px',
        verticalUnit: 'px'
      };
      break;
    case 'hline':
      newCommand = { identifier: newIdentifier, type: 'hline', syntaxModifier: 'to', value: derivedX, unit: 'px' };
      break;
    case 'vline':
      newCommand = { identifier: newIdentifier, type: 'vline', syntaxModifier: 'to', value: derivedY, unit: 'px' };
      break;
    case 'curve':
      newCommand = {
        identifier: newIdentifier,
        type: 'curve',
        syntaxModifier: 'to',
        xCoordinate: derivedX,
        yCoordinate: derivedY,
        horizontalUnit: 'px',
        verticalUnit: 'px',
        firstControlCircle: {
          xCoordinate: Math.round((previousPoint.xCoordinate + derivedX) / 2),
          yCoordinate: previousPoint.yCoordinate
        },
        firstControlHorizontalUnit: 'px',
        firstControlVerticalUnit: 'px',
        hasSecondControlCircle: false,
        secondControlCircle: { xCoordinate: 0, yCoordinate: 0 },
        secondControlHorizontalUnit: 'px',
        secondControlVerticalUnit: 'px'
      };
      break;
    case 'arc':
      newCommand = {
        identifier: newIdentifier,
        type: 'arc',
        syntaxModifier: 'to',
        xCoordinate: derivedX,
        yCoordinate: derivedY,
        horizontalUnit: 'px',
        verticalUnit: 'px',
        radiusX: 40,
        radiusXUnit: 'px',
        radiusY: 40,
        radiusYUnit: 'px',
        arcSize: 'small',
        sweepDirection: 'cw',
        rotationAngle: 0
      };
      break;
    case 'close':
      newCommand = { identifier: newIdentifier, type: 'close' };
      break;
  }

  if (insertIndex !== -1)
  {
    const selectedCommand = state.commandsStack[insertIndex];

    if (selectedCommand.type === 'close')
      state.commandsStack.splice(insertIndex, 0, newCommand);
    else
      state.commandsStack.splice(insertIndex + 1, 0, newCommand);
  } else
  {
    if (state.commandsStack.length > 1 && state.commandsStack[state.commandsStack.length - 1].type === 'close')
      state.commandsStack.splice(state.commandsStack.length - 1, 0, newCommand);
    else
      state.commandsStack.push(newCommand);
  }

  state.selectedCommandIdentifier = newIdentifier;
  stableRebuildCommandsSidebarDOM();
  updateVisualClippedLayoutAndCanvas();
  announceToScreenReader(state.currentLanguage === 'en' ? `Added step: ${newCommand.type}` : `Étape ajoutée : ${newCommand.type}`);
}

export function batchConvertAllCoordinates(targetUnit: Unit): void
{
  const computedMatrix = computeWholeCoordinatesMatrix(state.commandsStack);

  for (let index = 0; index < state.commandsStack.length; index = index + 1)
  {
    const
      currentCommand = state.commandsStack[index],
      absoluteRecord = computedMatrix[index],
      previousAnchor = index > 0
        ? computedMatrix[index - 1].absoluteEnd
        : { xCoordinate: 0, yCoordinate: 0 };

    const projectCoordinate = (absolutePixelValue: number): number =>
      convertPixelsToUnit(absolutePixelValue, targetUnit);

    switch (currentCommand.type)
    {
      case 'from':
      {
        currentCommand.xCoordinate = projectCoordinate(absoluteRecord.absoluteEnd.xCoordinate);
        currentCommand.yCoordinate = projectCoordinate(absoluteRecord.absoluteEnd.yCoordinate);
        currentCommand.horizontalUnit = targetUnit;
        currentCommand.verticalUnit = targetUnit;
        break;
      }

      case 'line':
      {
        if (currentCommand.syntaxModifier === 'to')
        {
          currentCommand.xCoordinate = projectCoordinate(absoluteRecord.absoluteEnd.xCoordinate);
          currentCommand.yCoordinate = projectCoordinate(absoluteRecord.absoluteEnd.yCoordinate);
        } else
        {
          const
            differentialX = absoluteRecord.absoluteEnd.xCoordinate - previousAnchor.xCoordinate,
            differentialY = absoluteRecord.absoluteEnd.yCoordinate - previousAnchor.yCoordinate;

          currentCommand.xCoordinate = projectCoordinate(differentialX);
          currentCommand.yCoordinate = projectCoordinate(differentialY);
        }

        currentCommand.horizontalUnit = targetUnit;
        currentCommand.verticalUnit = targetUnit;
        break;
      }

      case 'hline':
      {
        if (currentCommand.syntaxModifier === 'to')
          currentCommand.value = projectCoordinate(absoluteRecord.absoluteEnd.xCoordinate);
        else
        {
          const differentialX = absoluteRecord.absoluteEnd.xCoordinate - previousAnchor.xCoordinate;
          currentCommand.value = projectCoordinate(differentialX);
        }

        currentCommand.unit = targetUnit;
        break;
      }

      case 'vline':
      {
        if (currentCommand.syntaxModifier === 'to')
          currentCommand.value = projectCoordinate(absoluteRecord.absoluteEnd.yCoordinate);
        else
        {
          const differentialY = absoluteRecord.absoluteEnd.yCoordinate - previousAnchor.yCoordinate;
          currentCommand.value = projectCoordinate(differentialY);
        }

        currentCommand.unit = targetUnit;
        break;
      }

      case 'curve':
      {
        const
          referenceStartingPoint = currentCommand.syntaxModifier === 'to'
            ? { xCoordinate: 0, yCoordinate: 0 }
            : previousAnchor,
          differentialEndX = absoluteRecord.absoluteEnd.xCoordinate - referenceStartingPoint.xCoordinate,
          differentialEndY = absoluteRecord.absoluteEnd.yCoordinate - referenceStartingPoint.yCoordinate;

        currentCommand.xCoordinate = projectCoordinate(differentialEndX);
        currentCommand.yCoordinate = projectCoordinate(differentialEndY);
        currentCommand.horizontalUnit = targetUnit;
        currentCommand.verticalUnit = targetUnit;

        if (absoluteRecord.absoluteControlOne)
        {
          const
            differentialControlOneX = absoluteRecord.absoluteControlOne.xCoordinate - referenceStartingPoint.xCoordinate,
            differentialControlOneY = absoluteRecord.absoluteControlOne.yCoordinate - referenceStartingPoint.yCoordinate;

          currentCommand.firstControlCircle.xCoordinate = projectCoordinate(differentialControlOneX);
          currentCommand.firstControlCircle.yCoordinate = projectCoordinate(differentialControlOneY);
          currentCommand.firstControlHorizontalUnit = targetUnit;
          currentCommand.firstControlVerticalUnit = targetUnit;
        }

        if (currentCommand.hasSecondControlCircle && absoluteRecord.absoluteControlTwo)
        {
          const
            differentialControlTwoX = absoluteRecord.absoluteControlTwo.xCoordinate - referenceStartingPoint.xCoordinate,
            differentialControlTwoY = absoluteRecord.absoluteControlTwo.yCoordinate - referenceStartingPoint.yCoordinate;

          currentCommand.secondControlCircle.xCoordinate = projectCoordinate(differentialControlTwoX);
          currentCommand.secondControlCircle.yCoordinate = projectCoordinate(differentialControlTwoY);
          currentCommand.secondControlHorizontalUnit = targetUnit;
          currentCommand.secondControlVerticalUnit = targetUnit;
        }
        break;
      }

      case 'arc':
      {
        const
          referenceStartingPoint = currentCommand.syntaxModifier === 'to'
            ? { xCoordinate: 0, yCoordinate: 0 }
            : previousAnchor,
          differentialEndX = absoluteRecord.absoluteEnd.xCoordinate - referenceStartingPoint.xCoordinate,
          differentialEndY = absoluteRecord.absoluteEnd.yCoordinate - referenceStartingPoint.yCoordinate;

        currentCommand.xCoordinate = projectCoordinate(differentialEndX);
        currentCommand.yCoordinate = projectCoordinate(differentialEndY);
        currentCommand.horizontalUnit = targetUnit;
        currentCommand.verticalUnit = targetUnit;

        const
          radiusXPixels = convertUnitToPixels(currentCommand.radiusX, currentCommand.radiusXUnit),
          radiusYPixels = convertUnitToPixels(currentCommand.radiusY, currentCommand.radiusYUnit);

        currentCommand.radiusX = projectCoordinate(radiusXPixels);
        currentCommand.radiusY = projectCoordinate(radiusYPixels);
        currentCommand.radiusXUnit = targetUnit;
        currentCommand.radiusYUnit = targetUnit;
        break;
      }
    }
  }

  stableRebuildCommandsSidebarDOM();
  updateVisualClippedLayoutAndCanvas();
}

export function copyGeneratedCodeToClipboard(): void
{
  const codeContentText = state.currentSelectedCodeTab === 'static'
    ? compileShapeCodeString(state.commandsStack)
    : compileCSSAnimationCodeString();

  navigator.clipboard.writeText(codeContentText).then(() =>
  {
    const toast = document.getElementById('copySuccessToast');

    if (toast)
    {
      toast.classList.add('visible-state');
      toast.setAttribute('aria-hidden', 'false');

      setTimeout(() => {
        toast.classList.remove('visible-state');
        toast.setAttribute('aria-hidden', 'true');
      }, 3000);
    }
  });
}

export function saveCurrentStateForAnimation(slotSelection: 'A' | 'B'): void
{
  if (slotSelection === 'A')
    state.initialStateCommands = deepDuplicateStack(state.commandsStack);
  else
    state.finalStateCommands = deepDuplicateStack(state.commandsStack);

  refreshAnimationIndicatorsUI();

  toggleCollapsibleSection('animationPresetCard', 'expand');
  toggleCollapsibleSection('outputCard', 'expand');

  const
    tabStaticButton = document.getElementById('tabStaticCode'),
    tabAnimationButton = document.getElementById('tabAnimationCode');

  if (tabStaticButton && tabAnimationButton)
  {
    state.currentSelectedCodeTab = 'animation';
    tabAnimationButton.classList.add('active');
    tabAnimationButton.setAttribute('aria-selected', 'true');
    tabStaticButton.classList.remove('active');
    tabStaticButton.setAttribute('aria-selected', 'false');
  }

  const animationElement = document.getElementById('animatedClippedElement');

  if (animationElement)
  {
    animationElement.style.transition = 'none';
    const activeCommands = slotSelection === 'A' ? state.initialStateCommands : state.finalStateCommands;

    if (activeCommands)
    {
      const
        cleanCss = compileShapeCodeString(activeCommands),
        clipValue = `shape(${cleanCss.replace('clip-path: shape(', '').slice(0, -2)})`;

      animationElement.style.clipPath = clipValue;
    }
  }

  updateVisualClippedLayoutAndCanvas();
}

export function refreshAnimationIndicatorsUI(): void
{
  const
    indicatorInitialStateField = document.getElementById('indicatorStateA'),
    indicatorFinalStateField = document.getElementById('indicatorStateB');

  if (indicatorInitialStateField)
  {
    if (state.initialStateCommands)
    {
      indicatorInitialStateField.innerHTML = state.currentLanguage === 'en'
        ? `State A: <strong>${state.initialStateCommands.length} points saved</strong>`
        : `État A : <strong>${state.initialStateCommands.length} points enregistrés</strong>`;
    } else
    {
      indicatorInitialStateField.innerHTML = state.currentLanguage === 'en'
        ? `State A: <strong class="amber-highlight">Not saved</strong>`
        : `État A : <strong class="amber-highlight">Non enregistré</strong>`;
    }
  }

  if (indicatorFinalStateField)
  {
    if (state.finalStateCommands)
    {
      indicatorFinalStateField.innerHTML = state.currentLanguage === 'en'
        ? `State B: <strong>${state.finalStateCommands.length} points saved</strong>`
        : `État B : <strong>${state.finalStateCommands.length} points enregistrés</strong>`;
    } else
    {
      indicatorFinalStateField.innerHTML = state.currentLanguage === 'en'
        ? `State B: <strong class="amber-highlight">Not saved</strong>`
        : `État B : <strong class="amber-highlight">Non enregistré</strong>`;
    }
  }

  const animationElement = document.getElementById('animatedClippedElement');

  if (animationElement)
  {
    if (!state.initialStateCommands && !state.finalStateCommands)
      animationElement.style.clipPath = 'none';
    else if (state.initialStateCommands && !state.finalStateCommands)
    {
      animationElement.style.transition = 'none';
      const cleanCss = compileShapeCodeString(state.initialStateCommands);
      animationElement.style.clipPath = `shape(${cleanCss.replace('clip-path: shape(', '').slice(0, -2)})`;
    }
  }

  const triggerButton = document.getElementById('triggerTransitionTestButton') as HTMLButtonElement | null;

  if (triggerButton)
  {
    if (state.initialStateCommands && state.finalStateCommands)
    {
      const lengthCheck = state.initialStateCommands.length === state.finalStateCommands.length;
      let typesMatchCheck = true;

      if (lengthCheck)
      {
        for (let index = 0; index < state.initialStateCommands.length; index = index + 1)
        {
          if (state.initialStateCommands[index].type !== state.finalStateCommands[index].type)
          {
            typesMatchCheck = false;
            break;
          }
        }
      }

      if (lengthCheck && typesMatchCheck)
      {
        triggerButton.disabled = false;
        triggerButton.textContent = state.currentLanguage === 'en'
          ? '▶ Play Animation'
          : '▶ Lancer l\'Animation';
      } else
      {
        triggerButton.disabled = true;
        triggerButton.textContent = state.currentLanguage === 'en'
          ? 'Incompatible (Different structures)'
          : 'Incompatible (Structures différentes)';
      }
    } else
    {
      triggerButton.disabled = true;
      triggerButton.textContent = state.currentLanguage === 'en'
        ? 'Save A and B to test'
        : 'Enregistrez A et B pour tester';
    }
  }
}

export function performAnimationTransitionTest(): void
{
  if (!state.initialStateCommands || !state.finalStateCommands)
    return;

  toggleCollapsibleSection('animationPresetCard', 'expand');
  toggleCollapsibleSection('outputCard', 'expand');

  const
    tabStaticButton = document.getElementById('tabStaticCode'),
    tabAnimationButton = document.getElementById('tabAnimationCode');

  if (tabStaticButton && tabAnimationButton)
  {
    state.currentSelectedCodeTab = 'animation';
    tabAnimationButton.classList.add('active');
    tabAnimationButton.setAttribute('aria-selected', 'true');
    tabStaticButton.classList.remove('active');
    tabStaticButton.setAttribute('aria-selected', 'false');
    updateVisualClippedLayoutAndCanvas();
  }

  const
    animationElement = document.getElementById('animatedClippedElement'),
    durationSlider = document.getElementById('animationDurationRange') as HTMLInputElement | null,
    durationInSeconds = durationSlider ? durationSlider.value : '1.2';

  if (animationElement)
  {
    animationElement.style.transition = 'none';
    const cssA = compileShapeCodeString(state.initialStateCommands);
    animationElement.style.clipPath = `shape(${cssA.replace('clip-path: shape(', '').slice(0, -2)})`;

    void animationElement.offsetWidth;

    requestAnimationFrame(() =>
    {
      requestAnimationFrame(() =>
      {
        animationElement.style.transition = `clip-path ${durationInSeconds}s cubic-bezier(.4, 0, .2, 1)`;
        const cssB = compileShapeCodeString(state.finalStateCommands as ShapeCommand[]);
        animationElement.style.clipPath = `shape(${cssB.replace('clip-path: shape(', '').slice(0, -2)})`;
      });
    });
  }
}

export function renderPresetButtonCardsList(): void
{
  const container = document.getElementById('presetsGridContainer');

  if (!container)
    return;

  container.innerHTML = '';

  for (let index = 0; index < shapePresets.length; index = index + 1)
  {
    const
      presetObject = shapePresets[index],
      isCurrentActive = state.commandsStack.length === presetObject.commands.length &&
        (state.commandsStack[0] as FromCommand).xCoordinate === (presetObject.commands[0] as FromCommand).xCoordinate,
      presetName = presetLocalizations[state.currentLanguage][index]?.name || presetObject.name,
      presetDesc = presetLocalizations[state.currentLanguage][index]?.description || presetObject.description,
      buttonCard = document.createElement('button');

    buttonCard.setAttribute('type', 'button');
    buttonCard.setAttribute(
      'class',
      `preset-item-card${isCurrentActive ? ' active-setting' : ''}`
    );
    buttonCard.setAttribute('aria-label', state.currentLanguage === 'en'
      ? `Load preset ${presetName}: ${presetDesc}`
      : `Charger le préréglage ${presetName} : ${presetDesc}`);
    buttonCard.setAttribute('title', presetDesc);

    const iconContainer = document.createElement('div');
    iconContainer.setAttribute('class', 'preset-icon-container');

    const iconShape = document.createElement('div');
    iconShape.setAttribute('class', 'preset-icon-shape');

    const
      cssText = compileShapeCodeString(presetObject.commands),
      shapeValue = cssText.replace('clip-path:', '').replace(';', '').trim();

    iconShape.style.clipPath = shapeValue;

    iconContainer.appendChild(iconShape);
    buttonCard.appendChild(iconContainer);

    const nameTitle = document.createElement('span');
    nameTitle.setAttribute('class', 'preset-name');
    nameTitle.textContent = presetName;
    buttonCard.appendChild(nameTitle);

    buttonCard.addEventListener('click', () =>
    {
      loadSelectedPresetTemplate(presetObject);
    });

    container.appendChild(buttonCard);
  }
}

export function toggleCollapsibleSection(cardId: string, forceState?: 'expand' | 'collapse'): void
{
  const card = document.getElementById(cardId) as HTMLDetailsElement | null;

  if (!card)
    return;

  let shouldExpand = !card.open;

  if (forceState !== undefined)
    shouldExpand = (forceState === 'expand');

  if (shouldExpand)
  {
    card.open = true;
    localStorage.setItem('collapse_' + cardId, 'false');
    announceToScreenReader(state.currentLanguage === 'en' ? 'Section expanded' : 'Section développée');
  } else
  {
    card.open = false;
    localStorage.setItem('collapse_' + cardId, 'true');
    announceToScreenReader(state.currentLanguage === 'en' ? 'Section collapsed' : 'Section réduite');
  }
}

export function initializeCollapsibleSections(): void
{
  const cards = ['canvasCard', 'animationPresetCard', 'presetsCard', 'commandsCard', 'outputCard'];

  for (const cardId of cards)
  {
    const card = document.getElementById(cardId) as HTMLDetailsElement | null;

    if (!card)
      continue;

    const savedCollapseState = localStorage.getItem('collapse_' + cardId);
    card.open = !(savedCollapseState === 'true');

    card.addEventListener('toggle', () => {
      localStorage.setItem('collapse_' + cardId, card.open ? 'false' : 'true');
    });
  }
}

export function initializeUIEventHandlers(): void
{
  const paintboard = document.getElementById('paintboard');

  if (paintboard)
  {
    paintboard.addEventListener('dblclick', (event: MouseEvent) =>
    {
      if (event.target === paintboard || (event.target as HTMLElement).classList.contains('canvas-grid-lines'))
      {
        const logicalCoordinates = computeLogicalCoordinates(
          event.clientX,
          event.clientY,
          paintboard,
          false
        );

        handleCanvasDoubleClick(logicalCoordinates.xCoordinate, logicalCoordinates.yCoordinate);
      }
    });

    paintboard.addEventListener('pointermove', (event: PointerEvent) =>
    {
      const readout = document.getElementById('activeCoordinateReadout');

      if (readout)
      {
        const logicalCoordinates = computeLogicalCoordinates(
          event.clientX,
          event.clientY,
          paintboard,
          false
        );

        const
          logicalX = Math.round(logicalCoordinates.xCoordinate),
          logicalY = Math.round(logicalCoordinates.yCoordinate);

        if (logicalX >= 0 && logicalX <= 400 && logicalY >= 0 && logicalY <= 400)
        {
          const
            percentX = Math.round((logicalX / 400) * 100),
            percentY = Math.round((logicalY / 400) * 100);

          readout.textContent = state.currentLanguage === 'en'
            ? `Cursor: ${logicalX}px , ${logicalY}px (${percentX}% , ${percentY}%)`
            : `Curseur : ${logicalX}px , ${logicalY}px (${percentX}% , ${percentY}%)`;
        } else
          readout.textContent = state.currentLanguage === 'en' ? 'Cursor: -- , --' : 'Curseur : -- , --';
      }
    });

    paintboard.addEventListener('pointerleave', () =>
    {
      const readout = document.getElementById('activeCoordinateReadout');

      if (readout)
        readout.textContent = state.currentLanguage === 'en' ? 'Cursor: -- , --' : 'Curseur : -- , --';
    });
  }

  const backgroundButtons = document.querySelectorAll('.background-toggle-group .action-toggle-button');

  backgroundButtons.forEach(button =>
  {
    button.addEventListener('click', () =>
    {
      backgroundButtons.forEach(otherButton =>
      {
        otherButton.classList.remove('active');
        otherButton.setAttribute('aria-pressed', 'false');
      });

      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');

      const
        backgroundType = button.getAttribute('data-background'),
        paintboardElement = document.getElementById('paintboard'),
        photoElement = document.getElementById('previewPhoto');

      if (paintboardElement)
      {
        paintboardElement.className = 'draft-board';

        if (backgroundType === 'transparent')
          paintboardElement.classList.add('bg-transparent');
        else if (backgroundType === 'photo')
          paintboardElement.classList.add('bg-photo');
        else if (backgroundType === 'gradient')
          paintboardElement.classList.add('bg-gradient');
      }

      if (photoElement)
        photoElement.classList.toggle('hidden', (backgroundType !== 'photo'));
    });
  });

  const addCommandButtons = document.querySelectorAll('.command-creator-toolbar .add-command-btn');

  addCommandButtons.forEach(button =>
  {
    button.addEventListener('click', () =>
    {
      const presetType = button.getAttribute('data-preset-type') as CommandType;

      if (presetType)
        createAndAppendCommandBlock(presetType);
    });
  });

  const convertPixelsButton = document.getElementById('convertAllPxButton');

  if (convertPixelsButton)
    convertPixelsButton.addEventListener('click', () => batchConvertAllCoordinates('px'));

  const convertPercentageButton = document.getElementById('convertAllPercentButton');

  if (convertPercentageButton)
    convertPercentageButton.addEventListener('click', () => batchConvertAllCoordinates('%'));

  const convertRemButton = document.getElementById('convertAllRemButton');

  if (convertRemButton)
    convertRemButton.addEventListener('click', () => batchConvertAllCoordinates('rem'));

  const parentFontSizeInput = document.getElementById('parentFontSizeInput') as HTMLInputElement;

  if (parentFontSizeInput)
  {
    parentFontSizeInput.addEventListener('input', () =>
    {
      const value = parseInt(parentFontSizeInput.value, 10);

      if (isNaN(value) || value <= 0)
        return;

      state.parentFontSize = value;
      updateVisualClippedLayoutAndCanvas();
    });
  }

  const copyButton = document.getElementById('copyClipboardCodeButton');

  if (copyButton)
  {
    copyButton.addEventListener('click', (event: Event) =>
    {
      event.stopPropagation();
      event.preventDefault();
      copyGeneratedCodeToClipboard();
    });
  }

  const resetButton = document.getElementById('resetPointsButton');

  if (resetButton)
  {
    resetButton.addEventListener('click', () => {
      loadSelectedPresetTemplate(shapePresets[0]);
    });
  }

  const clearButton = document.getElementById('clearAllPointsButton');

  if (clearButton)
  {
    clearButton.addEventListener('click', () =>
    {
      state.commandsStack = [
        {
          identifier: 'cmd-clear-1',
          type: 'from',
          xCoordinate: 200,
          yCoordinate: 200,
          horizontalUnit: 'px',
          verticalUnit: 'px'
        }
      ];
      state.selectedCommandIdentifier = state.commandsStack[0].identifier;
      stableRebuildCommandsSidebarDOM();
      updateVisualClippedLayoutAndCanvas();
    });
  }

  const saveInitialStateButton = document.getElementById('saveStateAButton');

  if (saveInitialStateButton)
  {
    saveInitialStateButton.addEventListener('click', () =>
    {
      saveCurrentStateForAnimation('A');
    });
  }

  const saveFinalStateButton = document.getElementById('saveStateBButton');

  if (saveFinalStateButton)
  {
    saveFinalStateButton.addEventListener('click', () =>
    {
      saveCurrentStateForAnimation('B');
    });
  }

  const
    rangeSlider = document.getElementById('animationDurationRange') as HTMLInputElement | null,
    durationText = document.getElementById('durationValueOutput');

  if (rangeSlider && durationText)
  {
    rangeSlider.addEventListener('input', () =>
    {
      durationText.textContent = rangeSlider.value;
      updateVisualClippedLayoutAndCanvas();
    });
  }

  const tabStaticButton = document.getElementById('tabStaticCode');
  const tabAnimationButton = document.getElementById('tabAnimationCode');

  if (tabStaticButton && tabAnimationButton)
  {
    tabStaticButton.addEventListener('click', () =>
    {
      state.currentSelectedCodeTab = 'static';
      tabStaticButton.classList.add('active');
      tabStaticButton.setAttribute('aria-selected', 'true');
      tabAnimationButton.classList.remove('active');
      tabAnimationButton.setAttribute('aria-selected', 'false');
      updateVisualClippedLayoutAndCanvas();
    });

    tabAnimationButton.addEventListener('click', () =>
    {
      state.currentSelectedCodeTab = 'animation';
      tabAnimationButton.classList.add('active');
      tabAnimationButton.setAttribute('aria-selected', 'true');
      tabStaticButton.classList.remove('active');
      tabStaticButton.setAttribute('aria-selected', 'false');
      updateVisualClippedLayoutAndCanvas();
    });
  }

  const playButton = document.getElementById('triggerTransitionTestButton');

  if (playButton)
  {
    playButton.addEventListener('click', () =>
    {
      performAnimationTransitionTest();
    });
  }
}

window.addEventListener('DOMContentLoaded', () =>
{
  const paintboard = document.getElementById('paintboard');

  if (paintboard)
    paintboard.classList.add('bg-transparent');

  const
    themeButtons = document.querySelectorAll('.theme-switcher-group .theme-btn'),
    applyTheme = (targetTheme: 'dark' | 'light') =>
    {
      const lightTheme = targetTheme === 'light';
      document.body.classList.toggle('theme-light', lightTheme);
      document.body.classList.toggle('theme-dark', !lightTheme);

      themeButtons.forEach(button =>
      {
        button.classList.toggle('active', button.getAttribute('data-theme') === targetTheme);
      });

      localStorage.setItem('theme', targetTheme);
    };

  const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
  let initialTheme: 'dark' | 'light' = 'dark';

  if (savedTheme === 'dark' || savedTheme === 'light')
    initialTheme = savedTheme;
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)
    initialTheme = 'light';

  applyTheme(initialTheme);

  themeButtons.forEach(button =>
  {
    button.addEventListener('click', () =>
    {
      const selectedTheme = button.getAttribute('data-theme') as 'dark' | 'light';

      if (selectedTheme)
        applyTheme(selectedTheme);
    });
  });

  const switcherButtons = document.querySelectorAll('.language-switcher .lang-btn');

  switcherButtons.forEach(button =>
  {
    button.addEventListener('click', () =>
    {
      const selectedLanguage = button.getAttribute('data-lang') as 'en' | 'fr';

      if (selectedLanguage && selectedLanguage !== state.currentLanguage)
      {
        state.currentLanguage = selectedLanguage;
        switcherButtons.forEach(otherButton =>
        {
          otherButton.classList.toggle('active', otherButton === button);
        });

        translatePageHTML();
        stableRebuildCommandsSidebarDOM();
        renderPresetButtonCardsList();
        refreshAnimationIndicatorsUI();
        updateVisualClippedLayoutAndCanvas();
      }
    });
  });

  loadSelectedPresetTemplate(shapePresets[0]);

  state.initialStateCommands = deepDuplicateStack(shapePresets[0].commands);

  const modifiedPresetB = deepDuplicateStack(shapePresets[0].commands);

  if (modifiedPresetB.length > 7)
  {
    const pointSix = modifiedPresetB[6];
    const pointSeven = modifiedPresetB[7];

    if ('yCoordinate' in pointSix)
      pointSix.yCoordinate = 390;

    if ('yCoordinate' in pointSeven)
      pointSeven.yCoordinate = 260;
  }

  state.finalStateCommands = modifiedPresetB;

  initializeCollapsibleSections();
  initializeUIEventHandlers();
  translatePageHTML();
  renderPresetButtonCardsList();
  refreshAnimationIndicatorsUI();

  window.addEventListener('resize', adjustClippedElementScale);
});

/**
 * Sends a verbal notification to screen readers via an aria-live div.
 */
export function announceToScreenReader(message: string): void
{
  const announcer = document.getElementById('srLiveAnnouncer');

  if (announcer)
  {
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }
}