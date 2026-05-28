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
  LineCommand,
  HorizontalLineCommand,
  VerticalLineCommand,
  CurveCommand,
  ArcCommand,
  CloseCommand,
  ShapePreset
} from './types';

// Importing the SCSS style to let Vite understand it natively
import './style.scss';

// ==========================================
// Application Core State
// ==========================================

let commandsStack: ShapeCommand[] = [];
let selectedCommandIdentifier: string | null = null;

// Animation Workspace States
let stateACommands: ShapeCommand[] | null = null;
let stateBCommands: ShapeCommand[] | null = null;
let currentAnimationToggle: 'state_a' | 'state_b' = 'state_b';

let parentFontSize: number = 16;

/**
 * Converts value from specified unit to pure pixels on 400x400 canvas.
 */
function convertUnitToPx(value: number, unit: Unit): number {
  if (unit === '%') {
    return (value / 100) * 400;
  }
  if (unit === 'rem') {
    return value * parentFontSize;
  }
  return value;
}

/**
 * Converts absolute pure canvas pixel coordinate to target units.
 */
function convertPxToUnit(absolutePixelValue: number, unit: Unit): number {
  if (unit === '%') {
    const calculatedPercent = (absolutePixelValue / 400) * 100;
    return Math.round(calculatedPercent * 10) / 10;
  }
  if (unit === 'rem') {
    const calculatedRem = absolutePixelValue / parentFontSize;
    return Math.round(calculatedRem * 1000) / 1000;
  }
  return Math.round(absolutePixelValue);
}

// ==========================================
// Localization System Extra Types & Dictionaries
// ==========================================

let currentLanguage: 'en' | 'fr' = 'en';

interface LanguageDictionary {
  header_title: string;
  header_description: string;
  section_canvas_title: string;
  section_canvas_help: string;
  bg_label: string;
  bg_checkers: string;
  bg_photo: string;
  bg_gradient: string;
  btn_reset: string;
  btn_clear: string;
  animation_title: string;
  animation_help: string;
  btn_save_a: string;
  btn_save_b: string;
  duration_label: string;
  btn_run_animation: string;
  presets_title: string;
  presets_help: string;
  commands_title: string;
  convert_label: string;
  btn_convert_px: string;
  btn_convert_percent: string;
  btn_convert_rem: string;
  base_font_label: string;
  css_title: string;
  btn_copy: string;
  how_it_works_title: string;
  how_it_works_body: string;
  toast_copied: string;
  
  // DRAG TOGGLE / ADD BUTTONS EXTRAS
  btn_add_line: string;
  btn_add_hline: string;
  btn_add_vline: string;
  btn_add_curve: string;
  btn_add_arc: string;
  btn_add_close: string;
  
  // ARIA VALUES
  aria_canvas_section: string;
  aria_bg_group: string;
  aria_config_section: string;
  aria_commands_list: string;
  footer_text: string;
  footer_link_blog: string;
}

const localizationMatrix: Record<'en' | 'fr', LanguageDictionary> = {
  en: {
    header_title: 'CSS shape() Visual Editor',
    header_description: 'Generate beautiful responsive <code>clip-path: shape()</code> paths. Drag and drop interactive anchor and control points in real-time without guessing pixels.',
    section_canvas_title: 'Interactive Preview & Drawing',
    section_canvas_help: 'Double-click anywhere on the grid to add a point!',
    bg_label: 'Background:',
    bg_checkers: 'Checkers',
    bg_photo: 'Photo',
    bg_gradient: 'Gradient',
    btn_reset: 'Reset',
    btn_clear: 'Clear all',
    animation_title: 'shape() Animation Module',
    animation_help: 'In CSS, you can animate two <code>clip-path: shape()</code> paths as long as they have the same command structure. Save a reference state ("State A"), modify your shape, and trigger the transition!',
    btn_save_a: '✓ Set Initial State (A)',
    btn_save_b: '✓ Set Final State (B)',
    duration_label: 'Duration:',
    btn_run_animation: '▶ Play Animation',
    presets_title: 'Shape Presets',
    presets_help: 'Click on a preset to use it as a starting point:',
    commands_title: 'Command Structure',
    convert_label: 'Convert to:',
    btn_convert_px: 'Pixels (px)',
    btn_convert_percent: 'Percentage (%)',
    btn_convert_rem: 'REM (rem)',
    base_font_label: 'Base font-size:',
    css_title: 'Generated CSS shape() Code',
    btn_copy: 'Copy code',
    how_it_works_title: 'How it works:',
    how_it_works_body: 'The CSS Level 2 <code>shape()</code> function allows drawing complex clip paths using absolute or relative coordinates in pixels or percentages. It natively handles Bézier curves (<code>curve</code>) and elliptical arcs (<code>arc</code>).',
    toast_copied: '✓ Code copied successfully!',
    btn_add_line: 'Add a line',
    btn_add_hline: 'Add a horizontal line',
    btn_add_vline: 'Add a vertical line',
    btn_add_curve: 'Add a Bézier curve',
    btn_add_arc: 'Add an elliptical arc',
    btn_add_close: 'Add a close contour',
    aria_canvas_section: 'Interactive drawing workspace',
    aria_bg_group: 'Preview background style',
    aria_config_section: 'Shape configuration panel',
    aria_commands_list: 'List of drawing commands',
    footer_text: 'Want to discover other tools or connect?',
    footer_link_blog: 'Blog'
  },
  fr: {
    header_title: 'Éditeur Visuel CSS shape()',
    header_description: 'Générez de magnifiques tracés réactifs <code>clip-path: shape()</code>. Glissez-déposez des points interactifs d\'ancrage et de contrôle en temps réel sans tâtonner avec les pixels.',
    section_canvas_title: 'Aperçu Interactif & Dessin',
    section_canvas_help: 'Double-cliquez n\'importe où sur la grille pour ajouter un point !',
    bg_label: 'Arrière-plan :',
    bg_checkers: 'Damiers',
    bg_photo: 'Photo',
    bg_gradient: 'Dégradé',
    btn_reset: 'Réinitialiser',
    btn_clear: 'Effacer tout',
    animation_title: 'Module d\'Animation de shape()',
    animation_help: 'En CSS, vous pouvez animer deux <code>clip-path: shape()</code> à condition qu\'ils aient la même structure de commandes. Sauvegardez un état de référence ("Point A"), modifiez votre forme, puis lancez la transition !',
    btn_save_a: '✓ Fixer l\'État initial (A)',
    btn_save_b: '✓ Fixer l\'État final (B)',
    duration_label: 'Durée :',
    btn_run_animation: '▶ Lancer l\'Animation',
    presets_title: 'Préréglages de formes (Presets)',
    presets_help: 'Cliquez sur un préréglage pour l\'utiliser comme point de départ :',
    commands_title: 'Structure des Commandes',
    convert_label: 'Convertir en :',
    btn_convert_px: 'Pixels (px)',
    btn_convert_percent: 'Pourcentage (%)',
    btn_convert_rem: 'REM (rem)',
    base_font_label: 'Police de base :',
    css_title: 'Code CSS shape() Généré',
    btn_copy: 'Copier le code',
    how_it_works_title: 'Comprendre le fonctionnement :',
    how_it_works_body: 'La fonction <code>shape()</code> de CSS Level 2 permet de dessiner des chemins de découpe complexes en utilisant des coordonnées absolues ou relatives par rapport au pixel ou au pourcentage. Elle gère nativement les courbes de Bézier (<code>curve</code>) et les arcs elliptiques (<code>arc</code>).',
    toast_copied: '✓ Code copié avec succès !',
    btn_add_line: 'Ajouter une ligne',
    btn_add_hline: 'Ajouter une ligne horizontale',
    btn_add_vline: 'Ajouter une ligne verticale',
    btn_add_curve: 'Ajouter une courbe de Bézier',
    btn_add_arc: 'Ajouter un arc de cercle',
    btn_add_close: 'Ajouter une fermeture',
    aria_canvas_section: 'Zone interactive de dessin',
    aria_bg_group: 'Type d\'arrière-plan de l\'aperçu',
    aria_config_section: 'Panneau de configuration de la forme',
    aria_commands_list: 'Liste des directives de tracé',
    footer_text: 'Envie de découvrir d\'autres outils ou de me contacter ?',
    footer_link_blog: 'Blog'
  }
};

interface PresetTranslation {
  name: string;
  description: string;
}

const presetLocalizations: Record<'en' | 'fr', PresetTranslation[]> = {
  en: [
    { name: 'Speech bubble', description: 'Lionel Péramo\'s iconic speech bubble with curved edges.' },
    { name: 'Sacred Heart', description: 'Romantic drawing built using two cubic Bézier curves.' },
    { name: '5-point Star', description: 'An asymmetric geometric shape clipped into polygons.' },
    { name: 'National Shield', description: 'A majestic shape combining straight lines and curves.' },
    { name: 'Wave Banner', description: 'Beautiful layout header cut with a double waving ripple effect.' },
    { name: 'Octagonal Badge', description: 'A strict eight-sided geometric plaque.' }
  ],
  fr: [
    { name: 'Bulle de discussion', description: 'La bulle emblématique de Lionel Péramo avec bords courbes.' },
    { name: 'Cœur Sacré', description: 'Dessin romantique à l\'aide de deux courbes de Bézier cubiques.' },
    { name: 'Étoile à 5 branches', description: 'Une forme géométrique asymétrique découpée en polygones.' },
    { name: 'Bouclier National', description: 'Une forme majestueuse combinant lignes droites et arrondies.' },
    { name: 'Bannière Vague', description: 'Magnifique en-tête horizontal découpé avec une double ondulation.' },
    { name: 'Badge Octogonal', description: 'Une plaque géométrique stricte à huit côtés égale.' }
  ]
};

function translatePageHTML(): void {
  // Update HTML document lang tag
  document.documentElement.lang = currentLanguage;

  // Static standard textual blocks
  const textElements = document.querySelectorAll('[data-i18n]');
  textElements.forEach(element => {
    const key = element.getAttribute('data-i18n') as keyof LanguageDictionary;
    if (key && localizationMatrix[currentLanguage][key]) {
      element.textContent = localizationMatrix[currentLanguage][key];
    }
  });

  // HTML content block placeholders
  const htmlElements = document.querySelectorAll('[data-i18n-html]');
  htmlElements.forEach(element => {
    const key = element.getAttribute('data-i18n-html') as keyof LanguageDictionary;
    if (key && localizationMatrix[currentLanguage][key]) {
      element.innerHTML = localizationMatrix[currentLanguage][key];
    }
  });

  // Accessible aria attributes placeholders
  const ariaElements = document.querySelectorAll('[data-i18n-aria]');
  ariaElements.forEach(element => {
    const key = element.getAttribute('data-i18n-aria') as keyof LanguageDictionary;
    if (key && localizationMatrix[currentLanguage][key]) {
      element.setAttribute('aria-label', localizationMatrix[currentLanguage][key]);
    }
  });
}

// Custom presets loaded into application memory
const shapePresets: ShapePreset[] = [
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
  }
];

// ==========================================
// Anchor Point Calculation Engine (Absolute Matrix)
// ==========================================

interface ComputedCoordinates {
  absoluteEnd: Coordinate;
  absoluteControlOne?: Coordinate;
  absoluteControlTwo?: Coordinate;
}

/**
 * Iterates through the stack of commands sequentially, and calculates 
 * the physical coordinates (0-400px) of every anchor relative to standard grid size.
 */
function computeWholeCoordinatesMatrix(commands: ShapeCommand[]): ComputedCoordinates[] {
  let computedResultsList: ComputedCoordinates[] = [];
  let currentPositionX = 0;
  let currentPositionY = 0;
  let firstContourStartingPoint: Coordinate = { xCoordinate: 0, yCoordinate: 0 };

  for (let index = 0; index < commands.length; index = index + 1) {
    const currentCommand = commands[index];
    let absoluteEndX = currentPositionX;
    let absoluteEndY = currentPositionY;
    let absoluteControlOne: Coordinate | undefined;
    let absoluteControlTwo: Coordinate | undefined;

    switch (currentCommand.type) {
      case 'from': {
        const xCoordinateValue = currentCommand.xCoordinate;
        const yCoordinateValue = currentCommand.yCoordinate;
        absoluteEndX = convertUnitToPx(xCoordinateValue, currentCommand.horizontalUnit);
        absoluteEndY = convertUnitToPx(yCoordinateValue, currentCommand.verticalUnit);
        firstContourStartingPoint = { xCoordinate: absoluteEndX, yCoordinate: absoluteEndY };
        break;
      }
      
      case 'line': {
        const xCoordinateValue = currentCommand.xCoordinate;
        const yCoordinateValue = currentCommand.yCoordinate;
        const logicalTargetX = convertUnitToPx(xCoordinateValue, currentCommand.horizontalUnit);
        const logicalTargetY = convertUnitToPx(yCoordinateValue, currentCommand.verticalUnit);
        if (currentCommand.syntaxModifier === 'to') {
          absoluteEndX = logicalTargetX;
          absoluteEndY = logicalTargetY;
        } else {
          absoluteEndX = currentPositionX + logicalTargetX;
          absoluteEndY = currentPositionY + logicalTargetY;
        }
        break;
      }

      case 'hline': {
        const targetValue = currentCommand.value;
        const logicalTargetValue = convertUnitToPx(targetValue, currentCommand.unit);
        if (currentCommand.syntaxModifier === 'to') {
          absoluteEndX = logicalTargetValue;
        } else {
          absoluteEndX = currentPositionX + logicalTargetValue;
        }
        absoluteEndY = currentPositionY;
        break;
      }

      case 'vline': {
        const targetValue = currentCommand.value;
        const logicalTargetValue = convertUnitToPx(targetValue, currentCommand.unit);
        absoluteEndX = currentPositionX;
        if (currentCommand.syntaxModifier === 'to') {
          absoluteEndY = logicalTargetValue;
        } else {
          absoluteEndY = currentPositionY + logicalTargetValue;
        }
        break;
      }

      case 'curve': {
        const targetXCoordinate = currentCommand.xCoordinate;
        const targetYCoordinate = currentCommand.yCoordinate;
        const logicalTargetEndX = convertUnitToPx(targetXCoordinate, currentCommand.horizontalUnit);
        const logicalTargetEndY = convertUnitToPx(targetYCoordinate, currentCommand.verticalUnit);
        
        const controlOneXVal = currentCommand.firstControlCircle.xCoordinate;
        const controlOneYVal = currentCommand.firstControlCircle.yCoordinate;
        let logicalCtrl1X = convertUnitToPx(controlOneXVal, currentCommand.firstControlHorizontalUnit);
        let logicalCtrl1Y = convertUnitToPx(controlOneYVal, currentCommand.firstControlVerticalUnit);

        if (currentCommand.syntaxModifier === 'to') {
          absoluteEndX = logicalTargetEndX;
          absoluteEndY = logicalTargetEndY;
          absoluteControlOne = { xCoordinate: logicalCtrl1X, yCoordinate: logicalCtrl1Y };
          
          if (currentCommand.hasSecondControlCircle) {
            const controlTwoXVal = currentCommand.secondControlCircle.xCoordinate;
            const controlTwoYVal = currentCommand.secondControlCircle.yCoordinate;
            const logicalCtrl2X = convertUnitToPx(controlTwoXVal, currentCommand.secondControlHorizontalUnit);
            const logicalCtrl2Y = convertUnitToPx(controlTwoYVal, currentCommand.secondControlVerticalUnit);
            absoluteControlTwo = { xCoordinate: logicalCtrl2X, yCoordinate: logicalCtrl2Y };
          }
        } else {
          absoluteEndX = currentPositionX + logicalTargetEndX;
          absoluteEndY = currentPositionY + logicalTargetEndY;
          absoluteControlOne = { xCoordinate: currentPositionX + logicalCtrl1X, yCoordinate: currentPositionY + logicalCtrl1Y };
          
          if (currentCommand.hasSecondControlCircle) {
            const controlTwoXVal = currentCommand.secondControlCircle.xCoordinate;
            const controlTwoYVal = currentCommand.secondControlCircle.yCoordinate;
            const logicalCtrl2X = convertUnitToPx(controlTwoXVal, currentCommand.secondControlHorizontalUnit);
            const logicalCtrl2Y = convertUnitToPx(controlTwoYVal, currentCommand.secondControlVerticalUnit);
            absoluteControlTwo = { xCoordinate: currentPositionX + logicalCtrl2X, yCoordinate: currentPositionY + logicalCtrl2Y };
          }
        }
        break;
      }

      case 'arc': {
        const targetXCoordinate = currentCommand.xCoordinate;
        const targetYCoordinate = currentCommand.yCoordinate;
        const logicalTargetX = convertUnitToPx(targetXCoordinate, currentCommand.horizontalUnit);
        const logicalTargetY = convertUnitToPx(targetYCoordinate, currentCommand.verticalUnit);

        if (currentCommand.syntaxModifier === 'to') {
          absoluteEndX = logicalTargetX;
          absoluteEndY = logicalTargetY;
        } else {
          absoluteEndX = currentPositionX + logicalTargetX;
          absoluteEndY = currentPositionY + logicalTargetY;
        }
        break;
      }

      case 'close': {
        absoluteEndX = firstContourStartingPoint.xCoordinate;
        absoluteEndY = firstContourStartingPoint.yCoordinate;
        break;
      }
    }

    computedResultsList.push({
      absoluteEnd: { xCoordinate: absoluteEndX, yCoordinate: absoluteEndY },
      absoluteControlOne: absoluteControlOne,
      absoluteControlTwo: absoluteControlTwo
    });

    currentPositionX = absoluteEndX;
    currentPositionY = absoluteEndY;
  }

  return computedResultsList;
}

// ==========================================
// CSS Compilation Engine
// ==========================================

/**
 * Builds the pure CSS shape() string from the local command structures.
 * Formats standard coordinates beautifully.
 */
function compileShapeCodeString(commands: ShapeCommand[]): string {
  if (commands.length === 0) {
    return 'clip-path: none;';
  }

  const outputLines: string[] = [];

  for (let index = 0; index < commands.length; index = index + 1) {
    const currentCommand = commands[index];
    let statementLine = '';

    switch (currentCommand.type) {
      case 'from': {
        const xCoordinateValue = currentCommand.xCoordinate;
        const yCoordinateValue = currentCommand.yCoordinate;
        statementLine = `from ${xCoordinateValue}${currentCommand.horizontalUnit} ${yCoordinateValue}${currentCommand.verticalUnit}`;
        break;
      }

      case 'line': {
        const xCoordinateValue = currentCommand.xCoordinate;
        const yCoordinateValue = currentCommand.yCoordinate;
        statementLine = `line ${currentCommand.syntaxModifier} ${xCoordinateValue}${currentCommand.horizontalUnit} ${yCoordinateValue}${currentCommand.verticalUnit}`;
        break;
      }

      case 'hline': {
        statementLine = `hline ${currentCommand.syntaxModifier} ${currentCommand.value}${currentCommand.unit}`;
        break;
      }

      case 'vline': {
        statementLine = `vline ${currentCommand.syntaxModifier} ${currentCommand.value}${currentCommand.unit}`;
        break;
      }

      case 'curve': {
        const targetXCoordinate = currentCommand.xCoordinate;
        const targetYCoordinate = currentCommand.yCoordinate;
        const ctrl1XCoordinate = currentCommand.firstControlCircle.xCoordinate;
        const ctrl1YCoordinate = currentCommand.firstControlCircle.yCoordinate;

        let curveExpression = `curve ${currentCommand.syntaxModifier} ${targetXCoordinate}${currentCommand.horizontalUnit} ${targetYCoordinate}${currentCommand.verticalUnit} with ${ctrl1XCoordinate}${currentCommand.firstControlHorizontalUnit} ${ctrl1YCoordinate}${currentCommand.firstControlVerticalUnit}`;
        
        if (currentCommand.hasSecondControlCircle) {
          const ctrl2XCoordinate = currentCommand.secondControlCircle.xCoordinate;
          const ctrl2YCoordinate = currentCommand.secondControlCircle.yCoordinate;
          curveExpression = `${curveExpression} / ${ctrl2XCoordinate}${currentCommand.secondControlHorizontalUnit} ${ctrl2YCoordinate}${currentCommand.secondControlVerticalUnit}`;
        }
        statementLine = curveExpression;
        break;
      }

      case 'arc': {
        const targetXCoordinate = currentCommand.xCoordinate;
        const targetYCoordinate = currentCommand.yCoordinate;
        const rxCoordinate = currentCommand.radiusX;
        const ryCoordinate = currentCommand.radiusY;

        statementLine = `arc ${currentCommand.syntaxModifier} ${targetXCoordinate}${currentCommand.horizontalUnit} ${targetYCoordinate}${currentCommand.verticalUnit} of ${rxCoordinate}${currentCommand.radiusXUnit} ${ryCoordinate}${currentCommand.radiusYUnit} ${currentCommand.arcSize} ${currentCommand.sweepDirection}`;
        
        if (currentCommand.rotationAngle !== 0) {
          statementLine = `${statementLine} rotate ${currentCommand.rotationAngle}deg`;
        }
        break;
      }

      case 'close': {
        statementLine = 'close';
        break;
      }
    }

    if (statementLine) {
      outputLines.push(`  ${statementLine}`);
    }
  }

  return `clip-path: shape(\n${outputLines.join(',\n')}\n);`;
}

// ==========================================
// Unit Conversion Helpers
// ==========================================

/**
 * Perform a dynamic conversion of all coordinates inside the commands 
 * stack either directly to Pixels or Percentages in batch.
 */
function batchConvertAllCoordinates(targetUnit: Unit): void {
  const computedMatrix = computeWholeCoordinatesMatrix(commandsStack);
  
  for (let index = 0; index < commandsStack.length; index = index + 1) {
    const currentCommand = commandsStack[index];
    const absoluteRecord = computedMatrix[index];

    // Helper functions to convert a 0-400 absolute pixel value into target units
    const projectCoordinate = (absolutePixelValue: number): number => {
      return convertPxToUnit(absolutePixelValue, targetUnit);
    };

    switch (currentCommand.type) {
      case 'from': {
        // From commands are always absolute from top-left, meaning they behave identically to "to"
        currentCommand.xCoordinate = projectCoordinate(absoluteRecord.absoluteEnd.xCoordinate);
        currentCommand.yCoordinate = projectCoordinate(absoluteRecord.absoluteEnd.yCoordinate);
        currentCommand.horizontalUnit = targetUnit;
        currentCommand.verticalUnit = targetUnit;
        break;
      }

      case 'line': {
        if (currentCommand.syntaxModifier === 'to') {
          currentCommand.xCoordinate = projectCoordinate(absoluteRecord.absoluteEnd.xCoordinate);
          currentCommand.yCoordinate = projectCoordinate(absoluteRecord.absoluteEnd.yCoordinate);
        } else {
          // If relative "by", we calculate absolute difference from previous step
          const previousAnchor = index > 0 ? computedMatrix[index - 1].absoluteEnd : { xCoordinate: 0, yCoordinate: 0 };
          const differentialX = absoluteRecord.absoluteEnd.xCoordinate - previousAnchor.xCoordinate;
          const differentialY = absoluteRecord.absoluteEnd.yCoordinate - previousAnchor.yCoordinate;
          currentCommand.xCoordinate = projectCoordinate(differentialX);
          currentCommand.yCoordinate = projectCoordinate(differentialY);
        }
        currentCommand.horizontalUnit = targetUnit;
        currentCommand.verticalUnit = targetUnit;
        break;
      }

      case 'hline': {
        if (currentCommand.syntaxModifier === 'to') {
          currentCommand.value = projectCoordinate(absoluteRecord.absoluteEnd.xCoordinate);
        } else {
          const previousAnchor = index > 0 ? computedMatrix[index - 1].absoluteEnd : { xCoordinate: 0, yCoordinate: 0 };
          const differentialX = absoluteRecord.absoluteEnd.xCoordinate - previousAnchor.xCoordinate;
          currentCommand.value = projectCoordinate(differentialX);
        }
        currentCommand.unit = targetUnit;
        break;
      }

      case 'vline': {
        if (currentCommand.syntaxModifier === 'to') {
          currentCommand.value = projectCoordinate(absoluteRecord.absoluteEnd.yCoordinate);
        } else {
          const previousAnchor = index > 0 ? computedMatrix[index - 1].absoluteEnd : { xCoordinate: 0, yCoordinate: 0 };
          const differentialY = absoluteRecord.absoluteEnd.yCoordinate - previousAnchor.yCoordinate;
          currentCommand.value = projectCoordinate(differentialY);
        }
        currentCommand.unit = targetUnit;
        break;
      }

      case 'curve': {
        // Calculate endpoint coordinates
        const previousAnchor = index > 0 ? computedMatrix[index - 1].absoluteEnd : { xCoordinate: 0, yCoordinate: 0 };
        const referenceStartingPoint = currentCommand.syntaxModifier === 'to' ? { xCoordinate: 0, yCoordinate: 0 } : previousAnchor;

        const differentialEndX = absoluteRecord.absoluteEnd.xCoordinate - referenceStartingPoint.xCoordinate;
        const differentialEndY = absoluteRecord.absoluteEnd.yCoordinate - referenceStartingPoint.yCoordinate;
        currentCommand.xCoordinate = projectCoordinate(differentialEndX);
        currentCommand.yCoordinate = projectCoordinate(differentialEndY);
        currentCommand.horizontalUnit = targetUnit;
        currentCommand.verticalUnit = targetUnit;

        // Calculate control point coordinates
        if (absoluteRecord.absoluteControlOne) {
          const differentialCtrl1X = absoluteRecord.absoluteControlOne.xCoordinate - referenceStartingPoint.xCoordinate;
          const differentialCtrl1Y = absoluteRecord.absoluteControlOne.yCoordinate - referenceStartingPoint.yCoordinate;
          currentCommand.firstControlCircle.xCoordinate = projectCoordinate(differentialCtrl1X);
          currentCommand.firstControlCircle.yCoordinate = projectCoordinate(differentialCtrl1Y);
          currentCommand.firstControlHorizontalUnit = targetUnit;
          currentCommand.firstControlVerticalUnit = targetUnit;
        }

        if (currentCommand.hasSecondControlCircle && absoluteRecord.absoluteControlTwo) {
          const differentialCtrl2X = absoluteRecord.absoluteControlTwo.xCoordinate - referenceStartingPoint.xCoordinate;
          const differentialCtrl2Y = absoluteRecord.absoluteControlTwo.yCoordinate - referenceStartingPoint.yCoordinate;
          currentCommand.secondControlCircle.xCoordinate = projectCoordinate(differentialCtrl2X);
          currentCommand.secondControlCircle.yCoordinate = projectCoordinate(differentialCtrl2Y);
          currentCommand.secondControlHorizontalUnit = targetUnit;
          currentCommand.secondControlVerticalUnit = targetUnit;
        }
        break;
      }

      case 'arc': {
        const previousAnchor = index > 0 ? computedMatrix[index - 1].absoluteEnd : { xCoordinate: 0, yCoordinate: 0 };
        const referenceStartingPoint = currentCommand.syntaxModifier === 'to' ? { xCoordinate: 0, yCoordinate: 0 } : previousAnchor;

        const differentialEndX = absoluteRecord.absoluteEnd.xCoordinate - referenceStartingPoint.xCoordinate;
        const differentialEndY = absoluteRecord.absoluteEnd.yCoordinate - referenceStartingPoint.yCoordinate;
        currentCommand.xCoordinate = projectCoordinate(differentialEndX);
        currentCommand.yCoordinate = projectCoordinate(differentialEndY);
        currentCommand.horizontalUnit = targetUnit;
        currentCommand.verticalUnit = targetUnit;

        // Radii conversion (now correctly pre-resolving the old unit to px before projection)
        const rxPx = convertUnitToPx(currentCommand.radiusX, currentCommand.radiusXUnit);
        const ryPx = convertUnitToPx(currentCommand.radiusY, currentCommand.radiusYUnit);
        currentCommand.radiusX = projectCoordinate(rxPx);
        currentCommand.radiusY = projectCoordinate(ryPx);
        currentCommand.radiusXUnit = targetUnit;
        currentCommand.radiusYUnit = targetUnit;
        break;
      }
    }
  }

  // Reload the complete sidebar pane and trigger a redraw
  stableRebuildCommandsSidebarDOM();
  updateVisualClippedLayoutAndCanvas();
}

// ==========================================
// Deep Command Copier (for Animation States)
// ==========================================

function deepDuplicateStack(commands: ShapeCommand[]): ShapeCommand[] {
  return JSON.parse(JSON.stringify(commands));
}

// ==========================================
// DOM Renderers & Interactive Canvas UI
// ==========================================

/**
 * Scales the 400x400 clipped element block using CSS transforms, e.g. transform: scale(factor),
 * so that shape coordinates (both absolute pixels, rems, or percentages) align exactly with the SVG handlers.
 */
function adjustClippedElementScale(): void {
  const paintboard = document.getElementById('paintboard');
  const clippedElement = document.getElementById('clippedElement');
  if (paintboard && clippedElement) {
    const width = paintboard.clientWidth;
    const scale = width / 400;
    clippedElement.style.transform = `scale(${scale})`;
    clippedElement.style.transformOrigin = 'top left';
  }
}

/**
 * Triggers rendering update on both the real-time cropped visual, 
 * the SVG canvas overlays, connecting lines, code templates & auxiliary coordinates.
 */
function updateVisualClippedLayoutAndCanvas(): void {
  adjustClippedElementScale();
  const cssStringCode = compileShapeCodeString(commandsStack);
  
  // Update generated code text areas
  const codeOutputElement = document.getElementById('cssGeneratedCodeOutput');
  if (codeOutputElement) {
    codeOutputElement.textContent = cssStringCode;
  }

  // Update clipped visual div elements (takes standard percentage or absolute pixels clip-path)
  const clippedElement = document.getElementById('clippedElement');
  if (clippedElement) {
    clippedElement.style.clipPath = `shape(${cssStringCode.replace('clip-path: shape(', '').slice(0, -2)})`;
  }

  // Calculate the physical absolute points coordinates matrix for dragging
  const coordinatesMatrix = computeWholeCoordinatesMatrix(commandsStack);

  // Update SVG connecting polyline path
  const visualPolyline = document.getElementById('visualConnectingPolyline') as unknown as SVGPathElement | null;
  if (visualPolyline) {
    let svgPathInstructions = '';
    
    for (let index = 0; index < coordinatesMatrix.length; index = index + 1) {
      const record = coordinatesMatrix[index];
      const command = commandsStack[index];
      const coordinateX = record.absoluteEnd.xCoordinate;
      const coordinateY = record.absoluteEnd.yCoordinate;

      if (index === 0) {
        svgPathInstructions = `M ${coordinateX} ${coordinateY}`;
      } else {
        if (command.type === 'curve') {
          const controlOne = record.absoluteControlOne;
          const controlTwo = record.absoluteControlTwo;
          if (controlOne && controlTwo) {
            svgPathInstructions = `${svgPathInstructions} C ${controlOne.xCoordinate} ${controlOne.yCoordinate}, ${controlTwo.xCoordinate} ${controlTwo.yCoordinate}, ${coordinateX} ${coordinateY}`;
          } else if (controlOne) {
            svgPathInstructions = `${svgPathInstructions} Q ${controlOne.xCoordinate} ${controlOne.yCoordinate}, ${coordinateX} ${coordinateY}`;
          } else {
            svgPathInstructions = `${svgPathInstructions} L ${coordinateX} ${coordinateY}`;
          }
        } else if (command.type === 'close') {
          svgPathInstructions = `${svgPathInstructions} Z`;
        } else {
          svgPathInstructions = `${svgPathInstructions} L ${coordinateX} ${coordinateY}`;
        }
      }
    }
    
    visualPolyline.setAttribute('d', svgPathInstructions);
  }

  // Render Drag nodes inside Markers group
  rebuildCanvasSvgInteractionHandles(coordinatesMatrix);

  // Update counter readouts
  const activeNodesCountField = document.getElementById('activeNodesReadout');
  if (activeNodesCountField) {
    activeNodesCountField.textContent = currentLanguage === 'en' ? `Commands: ${commandsStack.length}` : `Commandes : ${commandsStack.length}`;
  }
}

/**
 * Destroys and recreates interactive circular points & controls on the SVG workspace overlay.
 */
function rebuildCanvasSvgInteractionHandles(coordinatesMatrix: ComputedCoordinates[]): void {
  const markersContainer = document.getElementById('interactiveMarkersGroup');
  const auxiliaryContainer = document.getElementById('auxiliaryJointLinesGroup');
  if (!markersContainer || !auxiliaryContainer) {
    return;
  }

  // Preserve keyboard focus across redraws
  const activeElementId = document.activeElement ? document.activeElement.id : null;

  markersContainer.innerHTML = '';
  auxiliaryContainer.innerHTML = '';

  for (let index = 0; index < commandsStack.length; index = index + 1) {
    const command = commandsStack[index];
    const absoluteRecord = coordinatesMatrix[index];

    // Close and commands with zero anchors do not need coordinate circles
    if (command.type === 'close') {
      continue;
    }

    // Previous point node reference for relative calculation offsets
    const previousAnchor = index > 0 ? coordinatesMatrix[index - 1].absoluteEnd : { xCoordinate: 0, yCoordinate: 0 };

    // Create the Main Anchor circular interact handle
    const anchorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    anchorGroup.setAttribute('class', `anchor-node-g${selectedCommandIdentifier === command.identifier ? ' selected-active' : ''}`);
    anchorGroup.setAttribute('id', `anchor-handle-${command.identifier}`);
    anchorGroup.setAttribute('tabindex', '0');
    anchorGroup.setAttribute('role', 'button');
    anchorGroup.setAttribute('aria-label', currentLanguage === 'en' ? `Anchor node for command ${index + 1} of type ${command.type}` : `Point d'ancrage de la commande ${index + 1} de type ${command.type}`);

    // Glow ring
    const glowRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glowRing.setAttribute('class', 'anchor-ring-glow');
    glowRing.setAttribute('cx', absoluteRecord.absoluteEnd.xCoordinate.toString());
    glowRing.setAttribute('cy', absoluteRecord.absoluteEnd.yCoordinate.toString());
    glowRing.setAttribute('r', '18');
    anchorGroup.appendChild(glowRing);

    // Large circle base
    const handleCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    handleCircle.setAttribute('class', 'anchor-circle');
    handleCircle.setAttribute('cx', absoluteRecord.absoluteEnd.xCoordinate.toString());
    handleCircle.setAttribute('cy', absoluteRecord.absoluteEnd.yCoordinate.toString());
    handleCircle.setAttribute('r', '7.5');
    anchorGroup.appendChild(handleCircle);

    // Small interior dot
    const innerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerDot.setAttribute('class', 'anchor-inner-dot');
    innerDot.setAttribute('cx', absoluteRecord.absoluteEnd.xCoordinate.toString());
    innerDot.setAttribute('cy', absoluteRecord.absoluteEnd.yCoordinate.toString());
    innerDot.setAttribute('r', '3');
    anchorGroup.appendChild(innerDot);

    // Add interactivity to selecting items by selecting them on pointerdown
    anchorGroup.addEventListener('pointerdown', (event: PointerEvent) => {
      event.stopPropagation();
      setFocusedActiveCommand(command.identifier);
      initializeHandleDragSequence(event, anchorGroup, (newLogicalX: number, newLogicalY: number) => {
        // Drag logic for Main Anchor point
        applyDragShiftToAnchor(command, index, previousAnchor, newLogicalX, newLogicalY);
      });
    });

    // Keyboard support for main anchor handle
    anchorGroup.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setFocusedActiveCommand(command.identifier);
        return;
      }

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();
        setFocusedActiveCommand(command.identifier);

        const currentX = absoluteRecord.absoluteEnd.xCoordinate;
        const currentY = absoluteRecord.absoluteEnd.yCoordinate;
        const step = event.shiftKey ? 10 : 1;

        let newX = currentX;
        let newY = currentY;

        if (event.key === 'ArrowLeft') {
          newX -= step;
        } else if (event.key === 'ArrowRight') {
          newX += step;
        } else if (event.key === 'ArrowUp') {
          newY -= step;
        } else if (event.key === 'ArrowDown') {
          newY += step;
        }

        newX = Math.round(Math.max(0, Math.min(400, newX)));
        newY = Math.round(Math.max(0, Math.min(400, newY)));

        applyDragShiftToAnchor(command, index, previousAnchor, newX, newY);
        announceToScreenReader(currentLanguage === 'en' ? `Moved point to ${newX}, ${newY}` : `Point déplacé à ${newX}, ${newY}`);
      }
    });

    markersContainer.appendChild(anchorGroup);

    // If the command is curve, render control points circles and auxiliary connecting lines
    if (command.type === 'curve' && absoluteRecord.absoluteControlOne) {
      // Curve commands starting anchor point reference coordinates
      const startOfCurveAnchor = previousAnchor;

      // Draw dashed connecting line for Control 1
      const lineOne = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      lineOne.setAttribute('class', 'svg-auxiliary-line');
      lineOne.setAttribute('x1', startOfCurveAnchor.xCoordinate.toString());
      lineOne.setAttribute('y1', startOfCurveAnchor.yCoordinate.toString());
      lineOne.setAttribute('x2', absoluteRecord.absoluteControlOne.xCoordinate.toString());
      lineOne.setAttribute('y2', absoluteRecord.absoluteControlOne.yCoordinate.toString());
      auxiliaryContainer.appendChild(lineOne);

      // Create Control 1 point group circular handle
      const controlOneGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      controlOneGroup.setAttribute('class', 'control-handle-g');
      controlOneGroup.setAttribute('id', `control-one-handle-${command.identifier}`);
      controlOneGroup.setAttribute('tabindex', '0');
      controlOneGroup.setAttribute('role', 'button');
      controlOneGroup.setAttribute('aria-label', currentLanguage === 'en' ? `Primary Bézier control point for command ${index + 1}` : `Poignée de contrôle initiale de la courbe de Bézier de l'élément numéro ${index + 1}`);

      const ctrl1Glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ctrl1Glow.setAttribute('class', 'ctrl-circle-glow');
      ctrl1Glow.setAttribute('cx', absoluteRecord.absoluteControlOne.xCoordinate.toString());
      ctrl1Glow.setAttribute('cy', absoluteRecord.absoluteControlOne.yCoordinate.toString());
      ctrl1Glow.setAttribute('r', '14');
      controlOneGroup.appendChild(ctrl1Glow);

      const ctrl1Circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ctrl1Circle.setAttribute('class', 'control-point-outer');
      ctrl1Circle.setAttribute('cx', absoluteRecord.absoluteControlOne.xCoordinate.toString());
      ctrl1Circle.setAttribute('cy', absoluteRecord.absoluteControlOne.yCoordinate.toString());
      ctrl1Circle.setAttribute('r', '5.5');
      controlOneGroup.appendChild(ctrl1Circle);

      const ctrl1Inner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ctrl1Inner.setAttribute('class', 'control-point-inner');
      ctrl1Inner.setAttribute('cx', absoluteRecord.absoluteControlOne.xCoordinate.toString());
      ctrl1Inner.setAttribute('cy', absoluteRecord.absoluteControlOne.yCoordinate.toString());
      ctrl1Inner.setAttribute('r', '2.5');
      controlOneGroup.appendChild(ctrl1Inner);

      controlOneGroup.addEventListener('pointerdown', (event: PointerEvent) => {
        event.stopPropagation();
        controlOneGroup.classList.add('active-drag');
        setFocusedActiveCommand(command.identifier);
        
        initializeHandleDragSequence(event, controlOneGroup, (newLogicalX: number, newLogicalY: number) => {
          // Drag shift implementation for Control 1
          applyDragShiftToControlPoint(command, 'first', startOfCurveAnchor, newLogicalX, newLogicalY);
        }, () => {
          controlOneGroup.classList.remove('active-drag');
        });
      });

      // Keyboard support for Control 1 handle
      controlOneGroup.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setFocusedActiveCommand(command.identifier);
          return;
        }

        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
          event.preventDefault();
          setFocusedActiveCommand(command.identifier);

          const currentX = absoluteRecord.absoluteControlOne.xCoordinate;
          const currentY = absoluteRecord.absoluteControlOne.yCoordinate;
          const step = event.shiftKey ? 10 : 1;

          let newX = currentX;
          let newY = currentY;

          if (event.key === 'ArrowLeft') {
            newX -= step;
          } else if (event.key === 'ArrowRight') {
            newX += step;
          } else if (event.key === 'ArrowUp') {
            newY -= step;
          } else if (event.key === 'ArrowDown') {
            newY += step;
          }

          newX = Math.round(Math.max(0, Math.min(400, newX)));
          newY = Math.round(Math.max(0, Math.min(400, newY)));

          applyDragShiftToControlPoint(command, 'first', startOfCurveAnchor, newX, newY);
        }
      });

      markersContainer.appendChild(controlOneGroup);

      // Draw dashed connecting lines & circles for Control 2 (if cubic Bézier active)
      if (command.hasSecondControlCircle && absoluteRecord.absoluteControlTwo) {
        const lineTwo = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        lineTwo.setAttribute('class', 'svg-auxiliary-line');
        lineTwo.setAttribute('x1', absoluteRecord.absoluteEnd.xCoordinate.toString());
        lineTwo.setAttribute('y1', absoluteRecord.absoluteEnd.yCoordinate.toString());
        lineTwo.setAttribute('x2', absoluteRecord.absoluteControlTwo.xCoordinate.toString());
        lineTwo.setAttribute('y2', absoluteRecord.absoluteControlTwo.yCoordinate.toString());
        auxiliaryContainer.appendChild(lineTwo);

        const controlTwoGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        controlTwoGroup.setAttribute('class', 'control-handle-g');
        controlTwoGroup.setAttribute('id', `control-two-handle-${command.identifier}`);
        controlTwoGroup.setAttribute('tabindex', '0');
        controlTwoGroup.setAttribute('role', 'button');
        controlTwoGroup.setAttribute('aria-label', currentLanguage === 'en' ? `Secondary Bézier control point for command ${index + 1}` : `Poignée de contrôle secondaire de la courbe de Bézier de l'élément numéro ${index + 1}`);

        const ctrl2Glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ctrl2Glow.setAttribute('class', 'ctrl-circle-glow');
        ctrl2Glow.setAttribute('cx', absoluteRecord.absoluteControlTwo.xCoordinate.toString());
        ctrl2Glow.setAttribute('cy', absoluteRecord.absoluteControlTwo.yCoordinate.toString());
        ctrl2Glow.setAttribute('r', '14');
        controlTwoGroup.appendChild(ctrl2Glow);

        const ctrl2Circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ctrl2Circle.setAttribute('class', 'control-point-outer');
        ctrl2Circle.setAttribute('cx', absoluteRecord.absoluteControlTwo.xCoordinate.toString());
        ctrl2Circle.setAttribute('cy', absoluteRecord.absoluteControlTwo.yCoordinate.toString());
        ctrl2Circle.setAttribute('r', '5.5');
        controlTwoGroup.appendChild(ctrl2Circle);

        const ctrl2Inner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ctrl2Inner.setAttribute('class', 'control-point-inner');
        ctrl2Inner.setAttribute('cx', absoluteRecord.absoluteControlTwo.xCoordinate.toString());
        ctrl2Inner.setAttribute('cy', absoluteRecord.absoluteControlTwo.yCoordinate.toString());
        ctrl2Inner.setAttribute('r', '2.5');
        controlTwoGroup.appendChild(ctrl2Inner);

        controlTwoGroup.addEventListener('pointerdown', (event: PointerEvent) => {
          event.stopPropagation();
          controlTwoGroup.classList.add('active-drag');
          setFocusedActiveCommand(command.identifier);
          
          initializeHandleDragSequence(event, controlTwoGroup, (newLogicalX: number, newLogicalY: number) => {
            // Drag shift implementation for Control 2
            applyDragShiftToControlPoint(command, 'second', startOfCurveAnchor, newLogicalX, newLogicalY);
          }, () => {
            controlTwoGroup.classList.remove('active-drag');
          });
        });

        // Keyboard support for Control 2 handle
        controlTwoGroup.addEventListener('keydown', (event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setFocusedActiveCommand(command.identifier);
            return;
          }

          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
            event.preventDefault();
            setFocusedActiveCommand(command.identifier);

            const currentX = absoluteRecord.absoluteControlTwo.xCoordinate;
            const currentY = absoluteRecord.absoluteControlTwo.yCoordinate;
            const step = event.shiftKey ? 10 : 1;

            let newX = currentX;
            let newY = currentY;

            if (event.key === 'ArrowLeft') {
              newX -= step;
            } else if (event.key === 'ArrowRight') {
              newX += step;
            } else if (event.key === 'ArrowUp') {
              newY -= step;
            } else if (event.key === 'ArrowDown') {
              newY += step;
            }

            newX = Math.round(Math.max(0, Math.min(400, newX)));
            newY = Math.round(Math.max(0, Math.min(400, newY)));

            applyDragShiftToControlPoint(command, 'second', startOfCurveAnchor, newX, newY);
          }
        });

        markersContainer.appendChild(controlTwoGroup);
      }
    }
  }

  // Restore keyboard focus context securely
  if (activeElementId) {
    const elementToFocus = document.getElementById(activeElementId);
    if (elementToFocus) {
      elementToFocus.focus();
    }
  }
}

/**
 * Handles mouse / touch dragging interactions tracking captured pointer relative positions
 */
function initializeHandleDragSequence(
  startPointerEvent: PointerEvent,
  captureTargetG: SVGElement,
  onMoveUpdateCallback: (logicalX: number, logicalY: number) => void,
  onDragEndCallback?: () => void
): void {
  const paintboard = document.getElementById('paintboard');
  if (!paintboard) {
    return;
  }

  // Request native pointer capture to follow coordinates securely outside canvas bounds
  try {
    captureTargetG.setPointerCapture(startPointerEvent.pointerId);
  } catch (e) {
    // Ignore if not supported or not allowed in specific containment
  }

  const pointerMoveHandler = (moveEvent: PointerEvent) => {
    const parentContainerRect = paintboard.getBoundingClientRect();
    
    // Add border width to offset calculation if it exists
    const borderLeft = parseInt(window.getComputedStyle(paintboard).borderLeftWidth) || 0;
    const borderTop = parseInt(window.getComputedStyle(paintboard).borderTopWidth) || 0;
    
    // Convert physical cursor coordinate into logical coordinate ratios inside drafting boundary
    const normalizedWidth = paintboard.clientWidth;
    const normalizedHeight = paintboard.clientHeight;
    const offsetPaddingX = parentContainerRect.left + borderLeft;
    const offsetPaddingY = parentContainerRect.top + borderTop;

    let relativeX = (moveEvent.clientX - offsetPaddingX) / normalizedWidth;
    let relativeY = (moveEvent.clientY - offsetPaddingY) / normalizedHeight;

    // Safety clamps
    relativeX = Math.max(-0.05, Math.min(1.05, relativeX));
    relativeY = Math.max(-0.05, Math.min(1.05, relativeY));

    const logicalX = relativeX * 400;
    const logicalY = relativeY * 400;

    onMoveUpdateCallback(logicalX, logicalY);
  };

  const pointerUpHandler = (releaseEvent: PointerEvent) => {
    try {
      captureTargetG.releasePointerCapture(releaseEvent.pointerId);
    } catch (e) {
      // Ignore
    }
    window.removeEventListener('pointermove', pointerMoveHandler);
    window.removeEventListener('pointerup', pointerUpHandler);
    window.removeEventListener('pointercancel', pointerUpHandler);
    
    if (onDragEndCallback) {
      onDragEndCallback();
    }
  };

  window.addEventListener('pointermove', pointerMoveHandler);
  window.addEventListener('pointerup', pointerUpHandler);
  window.addEventListener('pointercancel', pointerUpHandler);
}

// ==========================================
// Coordinate Modifiers (Physics updates)
// ==========================================

function applyDragShiftToAnchor(
  command: ShapeCommand,
  commandIndex: number,
  previousAnchor: Coordinate,
  logicalX: number,
  logicalY: number
): void {
  const horizontalOffsetReference = command.type === 'from' || (command as any).syntaxModifier === 'to' ? 0 : previousAnchor.xCoordinate;
  const verticalOffsetReference = command.type === 'from' || (command as any).syntaxModifier === 'to' ? 0 : previousAnchor.yCoordinate;

  const targetLogicalX = logicalX - horizontalOffsetReference;
  const targetLogicalY = logicalY - verticalOffsetReference;

  switch (command.type) {
    case 'from': {
      command.xCoordinate = convertPxToUnit(targetLogicalX, command.horizontalUnit);
      command.yCoordinate = convertPxToUnit(targetLogicalY, command.verticalUnit);
      
      // Update the bound text inputs in sidebar directly to ensure stable keyboard focus
      stablePushCoordinateValueToSidebarInputs(command.identifier, 'xCoordinate', command.xCoordinate);
      stablePushCoordinateValueToSidebarInputs(command.identifier, 'yCoordinate', command.yCoordinate);
      break;
    }

    case 'line': {
      command.xCoordinate = convertPxToUnit(targetLogicalX, command.horizontalUnit);
      command.yCoordinate = convertPxToUnit(targetLogicalY, command.verticalUnit);
      
      stablePushCoordinateValueToSidebarInputs(command.identifier, 'xCoordinate', command.xCoordinate);
      stablePushCoordinateValueToSidebarInputs(command.identifier, 'yCoordinate', command.yCoordinate);
      break;
    }

    case 'hline': {
      command.value = convertPxToUnit(targetLogicalX, command.unit);
      
      stablePushCoordinateValueToSidebarInputs(command.identifier, 'value', command.value);
      break;
    }

    case 'vline': {
      command.value = convertPxToUnit(targetLogicalY, command.unit);
      
      stablePushCoordinateValueToSidebarInputs(command.identifier, 'value', command.value);
      break;
    }

    case 'curve': {
      command.xCoordinate = convertPxToUnit(targetLogicalX, command.horizontalUnit);
      command.yCoordinate = convertPxToUnit(targetLogicalY, command.verticalUnit);
      
      stablePushCoordinateValueToSidebarInputs(command.identifier, 'xCoordinate', command.xCoordinate);
      stablePushCoordinateValueToSidebarInputs(command.identifier, 'yCoordinate', command.yCoordinate);
      break;
    }

    case 'arc': {
      command.xCoordinate = convertPxToUnit(targetLogicalX, command.horizontalUnit);
      command.yCoordinate = convertPxToUnit(targetLogicalY, command.verticalUnit);
      
      stablePushCoordinateValueToSidebarInputs(command.identifier, 'xCoordinate', command.xCoordinate);
      stablePushCoordinateValueToSidebarInputs(command.identifier, 'yCoordinate', command.yCoordinate);
      break;
    }
  }

  updateVisualClippedLayoutAndCanvas();
}

function applyDragShiftToControlPoint(
  command: CurveCommand,
  controlPointSelection: 'first' | 'second',
  curveStartingAnchor: Coordinate,
  logicalX: number,
  logicalY: number
): void {
  // If Curve uses relative 'by', the control points represent vector offsets from curveStartingAnchor
  const relativeOffsetReferenceX = command.syntaxModifier === 'to' ? 0 : curveStartingAnchor.xCoordinate;
  const relativeOffsetReferenceY = command.syntaxModifier === 'to' ? 0 : curveStartingAnchor.yCoordinate;

  const targetLogicalX = logicalX - relativeOffsetReferenceX;
  const targetLogicalY = logicalY - relativeOffsetReferenceY;

  if (controlPointSelection === 'first') {
    command.firstControlCircle.xCoordinate = convertPxToUnit(targetLogicalX, command.firstControlHorizontalUnit);
    command.firstControlCircle.yCoordinate = convertPxToUnit(targetLogicalY, command.firstControlVerticalUnit);
    
    stablePushCoordinateValueToSidebarInputs(command.identifier, 'firstControlCircle-xCoordinate', command.firstControlCircle.xCoordinate);
    stablePushCoordinateValueToSidebarInputs(command.identifier, 'firstControlCircle-yCoordinate', command.firstControlCircle.yCoordinate);
  } else {
    command.secondControlCircle.xCoordinate = convertPxToUnit(targetLogicalX, command.secondControlHorizontalUnit);
    command.secondControlCircle.yCoordinate = convertPxToUnit(targetLogicalY, command.secondControlVerticalUnit);
    
    stablePushCoordinateValueToSidebarInputs(command.identifier, 'secondControlCircle-xCoordinate', command.secondControlCircle.xCoordinate);
    stablePushCoordinateValueToSidebarInputs(command.identifier, 'secondControlCircle-yCoordinate', command.secondControlCircle.yCoordinate);
  }

  updateVisualClippedLayoutAndCanvas();
}

/**
 * Direct pushing values from dragged points straight into sidebar HTML inputs
 * to guarantee that the cursor/keyboard focus does not break.
 */
function stablePushCoordinateValueToSidebarInputs(
  commandIdentifier: string,
  inputPropertySuffix: string,
  newValue: number
): void {
  const targetElementId = `input-${commandIdentifier}-${inputPropertySuffix}`;
  const inputElement = document.getElementById(targetElementId) as HTMLInputElement | null;
  if (inputElement) {
    inputElement.value = newValue.toString();
  }
}

// ==========================================
// Focus and Selection Actions
// ==========================================

function setFocusedActiveCommand(commandIdentifier: string | null): void {
  selectedCommandIdentifier = commandIdentifier;

  // Visual re-border for card list
  const cards = document.querySelectorAll('.command-item-card');
  cards.forEach(card => {
    const elementId = card.getAttribute('data-id');
    if (elementId === commandIdentifier) {
      card.classList.add('selected-active');
    } else {
      card.classList.remove('selected-active');
    }
  });

  // Highlight points in SVG overlay
  const anchorGroups = document.querySelectorAll('.anchor-node-g');
  anchorGroups.forEach(group => {
    const groupId = group.getAttribute('id');
    if (groupId === `anchor-handle-${commandIdentifier}`) {
      group.classList.add('selected-active');
    } else {
      group.classList.remove('selected-active');
    }
  });
}

// ==========================================
// Sidebar Commands List builder (stable keyboard input)
// ==========================================

function stableRebuildCommandsSidebarDOM(): void {
  const container = document.getElementById('commandsListStack');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  for (let index = 0; index < commandsStack.length; index = index + 1) {
    const command = commandsStack[index];
    const isFirstCommand = index === 0;
    const isLastCommand = index === commandsStack.length - 1;
    let isSecondToLast = false;
    
    if (commandsStack.length > 2 && commandsStack[commandsStack.length - 1].type === 'close') {
      isSecondToLast = index === commandsStack.length - 2;
    }

    const commandCard = document.createElement('div');
    commandCard.setAttribute('class', `command-item-card${selectedCommandIdentifier === command.identifier ? ' selected-active' : ''}`);
    commandCard.setAttribute('data-id', command.identifier);
    commandCard.setAttribute('role', 'listitem');

    // Make clicking the card focus it
    commandCard.addEventListener('click', (event: MouseEvent) => {
      // Direct click on input elements should not override input event triggers
      const targetTag = (event.target as HTMLElement).tagName.toLowerCase();
      if (targetTag !== 'input' && targetTag !== 'select' && targetTag !== 'button') {
        setFocusedActiveCommand(command.identifier);
      }
    });

    // Subheader section with Reorder arrows and delete buttons
    const cardHeader = document.createElement('div');
    cardHeader.setAttribute('class', 'item-header-meta');

    const brandLayout = document.createElement('div');
    brandLayout.setAttribute('class', 'command-type-label-badge');
    
    const indicatorDot = document.createElement('span');
    indicatorDot.setAttribute('class', `type-indicator-colored color-${command.type}`);
    brandLayout.appendChild(indicatorDot);

    const typeTitle = document.createElement('span');
    typeTitle.textContent = command.type;
    brandLayout.appendChild(typeTitle);

    const numbering = document.createElement('span');
    numbering.setAttribute('class', 'number-badge');
    numbering.textContent = `#${index + 1}`;
    brandLayout.appendChild(numbering);

    cardHeader.appendChild(brandLayout);

    // Meta Control Buttons Group
    const headerActionsGroup = document.createElement('div');
    headerActionsGroup.setAttribute('class', 'header-actions-group');

    // Up Arrow Reorder Button
    const arrowUp = document.createElement('button');
    arrowUp.setAttribute('type', 'button');
    arrowUp.setAttribute('class', 'reorder-arrow-btn');
    arrowUp.setAttribute('aria-label', currentLanguage === 'en' ? `Move command ${index + 1} up` : `Déplacer la commande ${index + 1} vers le haut`);
    arrowUp.innerHTML = '▲';
    // The "from" command at position 0 cannot move. The command at position 1 cannot move above "from".
    arrowUp.disabled = isFirstCommand || index === 1;
    arrowUp.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation();
      swapCommandsInStack(index, index - 1);
    });
    headerActionsGroup.appendChild(arrowUp);

    // Down Arrow Reorder Button
    const arrowDown = document.createElement('button');
    arrowDown.setAttribute('type', 'button');
    arrowDown.setAttribute('class', 'reorder-arrow-btn');
    arrowDown.setAttribute('aria-label', currentLanguage === 'en' ? `Move command ${index + 1} down` : `Déplacer l'étape ${index + 1} vers le bas`);
    arrowDown.innerHTML = '▼';
    // Cannot move the last element if it is "close" or if it is already the end.
    arrowDown.disabled = isLastCommand || isSecondToLast || (command.type === 'close');
    arrowDown.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation();
      swapCommandsInStack(index, index + 1);
    });
    headerActionsGroup.appendChild(arrowDown);

    // Delete Button (the starting "from" can never be deleted)
    const deleteBtn = document.createElement('button');
    deleteBtn.setAttribute('type', 'button');
    deleteBtn.setAttribute('class', 'delete-row-btn');
    deleteBtn.setAttribute('aria-label', currentLanguage === 'en' ? `Delete command step ${index + 1}` : `Supprimer l'étape de commande ${index + 1}`);
    deleteBtn.innerHTML = '✕';
    deleteBtn.disabled = isFirstCommand;
    deleteBtn.addEventListener('click', (event: MouseEvent) => {
      event.stopPropagation();
      removeCommandFromStack(command.identifier);
    });
    headerActionsGroup.appendChild(deleteBtn);

    cardHeader.appendChild(headerActionsGroup);
    commandCard.appendChild(cardHeader);

    // Inputs collection body template creation based on types
    const inputsColumns = document.createElement('div');
    inputsColumns.setAttribute('class', 'inputs-columns-layout');

    switch (command.type) {
      case 'from': {
        const fromCommandRef = command as FromCommand;
        
        // Horizontal coordinate (X)
        inputsColumns.appendChild(buildNumericParameterControlCell(fromCommandRef.identifier, 'xCoordinate', 'X (horiz)', fromCommandRef.xCoordinate, (newValue: number) => {
          fromCommandRef.xCoordinate = newValue;
          updateVisualClippedLayoutAndCanvas();
        }));
        
        inputsColumns.appendChild(buildDropdownUnitParameterCell(fromCommandRef.identifier, 'horizontalUnit', currentLanguage === 'en' ? 'X Unit' : 'Unité X', fromCommandRef.horizontalUnit, (newUnit: Unit) => {
          fromCommandRef.horizontalUnit = newUnit;
          updateVisualClippedLayoutAndCanvas();
        }));

        // Vertical coordinate (Y)
        inputsColumns.appendChild(buildNumericParameterControlCell(fromCommandRef.identifier, 'yCoordinate', 'Y (vrt)', fromCommandRef.yCoordinate, (newValue: number) => {
          fromCommandRef.yCoordinate = newValue;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildDropdownUnitParameterCell(fromCommandRef.identifier, 'verticalUnit', currentLanguage === 'en' ? 'Y Unit' : 'Unité Y', fromCommandRef.verticalUnit, (newUnit: Unit) => {
          fromCommandRef.verticalUnit = newUnit;
          updateVisualClippedLayoutAndCanvas();
        }));
        break;
      }

      case 'line': {
        const lineCommandRef = command as LineCommand;

        // Modifier [to | by] dropdown
        inputsColumns.appendChild(buildSyntaxModifierDropdownCell(lineCommandRef.identifier, 'syntaxModifier', 'Mode', lineCommandRef.syntaxModifier, (newModifier: 'to' | 'by') => {
          lineCommandRef.syntaxModifier = newModifier;
          updateVisualClippedLayoutAndCanvas();
        }));

        // Horizontal coordinate (X)
        inputsColumns.appendChild(buildNumericParameterControlCell(lineCommandRef.identifier, 'xCoordinate', 'X', lineCommandRef.xCoordinate, (newValue: number) => {
          lineCommandRef.xCoordinate = newValue;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildDropdownUnitParameterCell(lineCommandRef.identifier, 'horizontalUnit', currentLanguage === 'en' ? 'X Unit' : 'Unité X', lineCommandRef.horizontalUnit, (newUnit: Unit) => {
          lineCommandRef.horizontalUnit = newUnit;
          updateVisualClippedLayoutAndCanvas();
        }));

        // Vertical coordinate (Y)
        inputsColumns.appendChild(buildNumericParameterControlCell(lineCommandRef.identifier, 'yCoordinate', 'Y', lineCommandRef.yCoordinate, (newValue: number) => {
          lineCommandRef.yCoordinate = newValue;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildDropdownUnitParameterCell(lineCommandRef.identifier, 'verticalUnit', currentLanguage === 'en' ? 'Y Unit' : 'Unité Y', lineCommandRef.verticalUnit, (newUnit: Unit) => {
          lineCommandRef.verticalUnit = newUnit;
          updateVisualClippedLayoutAndCanvas();
        }));
        break;
      }

      case 'hline': {
        const hlineCommandRef = command as HorizontalLineCommand;

        // Modifier [to | by] dropdown
        inputsColumns.appendChild(buildSyntaxModifierDropdownCell(hlineCommandRef.identifier, 'syntaxModifier', 'Mode', hlineCommandRef.syntaxModifier, (newModifier: 'to' | 'by') => {
          hlineCommandRef.syntaxModifier = newModifier;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildNumericParameterControlCell(hlineCommandRef.identifier, 'value', currentLanguage === 'en' ? 'Value' : 'Valeur', hlineCommandRef.value, (newValue: number) => {
          hlineCommandRef.value = newValue;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildDropdownUnitParameterCell(hlineCommandRef.identifier, 'unit', currentLanguage === 'en' ? 'Unit' : 'Unité', hlineCommandRef.unit, (newUnit: Unit) => {
          hlineCommandRef.unit = newUnit;
          updateVisualClippedLayoutAndCanvas();
        }));
        break;
      }

      case 'vline': {
        const vlineCommandRef = command as VerticalLineCommand;

        // Modifier [to | by] dropdown
        inputsColumns.appendChild(buildSyntaxModifierDropdownCell(vlineCommandRef.identifier, 'syntaxModifier', 'Mode', vlineCommandRef.syntaxModifier, (newModifier: 'to' | 'by') => {
          vlineCommandRef.syntaxModifier = newModifier;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildNumericParameterControlCell(vlineCommandRef.identifier, 'value', currentLanguage === 'en' ? 'Value' : 'Valeur', vlineCommandRef.value, (newValue: number) => {
          vlineCommandRef.value = newValue;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildDropdownUnitParameterCell(vlineCommandRef.identifier, 'unit', currentLanguage === 'en' ? 'Unit' : 'Unité', vlineCommandRef.unit, (newUnit: Unit) => {
          vlineCommandRef.unit = newUnit;
          updateVisualClippedLayoutAndCanvas();
        }));
        break;
      }

      case 'curve': {
        const curveCommandRef = command as CurveCommand;

        // Modifier [to | by] dropdown
        inputsColumns.appendChild(buildSyntaxModifierDropdownCell(curveCommandRef.identifier, 'syntaxModifier', 'Mode', curveCommandRef.syntaxModifier, (newModifier: 'to' | 'by') => {
          curveCommandRef.syntaxModifier = newModifier;
          updateVisualClippedLayoutAndCanvas();
        }));

        // EndPoint Coordinates
        inputsColumns.appendChild(buildNumericParameterControlCell(curveCommandRef.identifier, 'xCoordinate', currentLanguage === 'en' ? 'End X' : 'Fin X', curveCommandRef.xCoordinate, (newValue: number) => {
          curveCommandRef.xCoordinate = newValue;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildDropdownUnitParameterCell(curveCommandRef.identifier, 'horizontalUnit', currentLanguage === 'en' ? 'End X Unit' : 'Unité Fin X', curveCommandRef.horizontalUnit, (newUnit: Unit) => {
          curveCommandRef.horizontalUnit = newUnit;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildNumericParameterControlCell(curveCommandRef.identifier, 'yCoordinate', currentLanguage === 'en' ? 'End Y' : 'Fin Y', curveCommandRef.yCoordinate, (newValue: number) => {
          curveCommandRef.yCoordinate = newValue;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildDropdownUnitParameterCell(curveCommandRef.identifier, 'verticalUnit', currentLanguage === 'en' ? 'End Y Unit' : 'Unité Fin Y', curveCommandRef.verticalUnit, (newUnit: Unit) => {
          curveCommandRef.verticalUnit = newUnit;
          updateVisualClippedLayoutAndCanvas();
        }));

        // Ctrl 1 Coordinates
        inputsColumns.appendChild(buildNumericParameterControlCell(curveCommandRef.identifier, 'firstControlCircle-xCoordinate', 'Ctrl1 X', curveCommandRef.firstControlCircle.xCoordinate, (newValue: number) => {
          curveCommandRef.firstControlCircle.xCoordinate = newValue;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildDropdownUnitParameterCell(curveCommandRef.identifier, 'firstControlHorizontalUnit', currentLanguage === 'en' ? 'Ctrl1 X Unit' : 'Unité Ctrl1 X', curveCommandRef.firstControlHorizontalUnit, (newUnit: Unit) => {
          curveCommandRef.firstControlHorizontalUnit = newUnit;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildNumericParameterControlCell(curveCommandRef.identifier, 'firstControlCircle-yCoordinate', 'Ctrl1 Y', curveCommandRef.firstControlCircle.yCoordinate, (newValue: number) => {
          curveCommandRef.firstControlCircle.yCoordinate = newValue;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildDropdownUnitParameterCell(curveCommandRef.identifier, 'firstControlVerticalUnit', currentLanguage === 'en' ? 'Ctrl1 Y Unit' : 'Unité Ctrl1 Y', curveCommandRef.firstControlVerticalUnit, (newUnit: Unit) => {
          curveCommandRef.firstControlVerticalUnit = newUnit;
          updateVisualClippedLayoutAndCanvas();
        }));

        // Option to Toggle Cubic (Ctrl 2) structure
        const controlToggleCell = document.createElement('div');
        controlToggleCell.setAttribute('class', 'field-toggle-cell');

        const ctrlLabel = document.createElement('span');
        ctrlLabel.setAttribute('class', 'label-caption');
        ctrlLabel.textContent = currentLanguage === 'en' ? 'Curve' : 'Courbe';

        const ctrlSelect = document.createElement('select');
        ctrlSelect.setAttribute('class', 'action-select-dropdown');
        ctrlSelect.setAttribute('aria-label', currentLanguage === 'en' ? `Curve type for step ${index + 1}` : `Type de courbe pour l'étape ${index + 1}`);

        const quadraticOption = document.createElement('option');
        quadraticOption.value = 'quadratic';
        quadraticOption.textContent = currentLanguage === 'en' ? 'Quadratic (1 Ctrl)' : 'Quadratique (1 Ctrl)';
        quadraticOption.selected = !curveCommandRef.hasSecondControlCircle;

        const cubicOption = document.createElement('option');
        cubicOption.value = 'cubic';
        cubicOption.textContent = currentLanguage === 'en' ? 'Cubic (2 Ctrl)' : 'Cubique (2 Ctrl)';
        cubicOption.selected = curveCommandRef.hasSecondControlCircle;

        ctrlSelect.appendChild(quadraticOption);
        ctrlSelect.appendChild(cubicOption);
        controlToggleCell.appendChild(ctrlLabel);
        controlToggleCell.appendChild(ctrlSelect);
        inputsColumns.appendChild(controlToggleCell);

        ctrlSelect.addEventListener('change', () => {
          const isSelectedCubic = ctrlSelect.value === 'cubic';
          curveCommandRef.hasSecondControlCircle = isSelectedCubic;
          if (isSelectedCubic && curveCommandRef.secondControlCircle.xCoordinate === 0 && curveCommandRef.secondControlCircle.yCoordinate === 0) {
            // Place it with default safe coordinates near end point
            curveCommandRef.secondControlCircle.xCoordinate = Math.round(curveCommandRef.xCoordinate * 0.8);
            curveCommandRef.secondControlCircle.yCoordinate = Math.round(curveCommandRef.yCoordinate * 0.8);
            curveCommandRef.secondControlHorizontalUnit = curveCommandRef.horizontalUnit;
            curveCommandRef.secondControlVerticalUnit = curveCommandRef.verticalUnit;
          }
          stableRebuildCommandsSidebarDOM();
          updateVisualClippedLayoutAndCanvas();
        });

        // Show Ctrl 2 fields if Cubic active
        if (curveCommandRef.hasSecondControlCircle) {
          inputsColumns.appendChild(buildNumericParameterControlCell(curveCommandRef.identifier, 'secondControlCircle-xCoordinate', 'Ctrl2 X', curveCommandRef.secondControlCircle.xCoordinate, (newValue: number) => {
            curveCommandRef.secondControlCircle.xCoordinate = newValue;
            updateVisualClippedLayoutAndCanvas();
          }));

          inputsColumns.appendChild(buildDropdownUnitParameterCell(curveCommandRef.identifier, 'secondControlHorizontalUnit', currentLanguage === 'en' ? 'Ctrl2 X Unit' : 'Unité Ctrl2 X', curveCommandRef.secondControlHorizontalUnit, (newUnit: Unit) => {
            curveCommandRef.secondControlHorizontalUnit = newUnit;
            updateVisualClippedLayoutAndCanvas();
          }));

          inputsColumns.appendChild(buildNumericParameterControlCell(curveCommandRef.identifier, 'secondControlCircle-yCoordinate', 'Ctrl2 Y', curveCommandRef.secondControlCircle.yCoordinate, (newValue: number) => {
            curveCommandRef.secondControlCircle.yCoordinate = newValue;
            updateVisualClippedLayoutAndCanvas();
          }));

          inputsColumns.appendChild(buildDropdownUnitParameterCell(curveCommandRef.identifier, 'secondControlVerticalUnit', currentLanguage === 'en' ? 'Ctrl2 Y Unit' : 'Unité Ctrl2 Y', curveCommandRef.secondControlVerticalUnit, (newUnit: Unit) => {
            curveCommandRef.secondControlVerticalUnit = newUnit;
            updateVisualClippedLayoutAndCanvas();
          }));
        }
        break;
      }

      case 'arc': {
        const arcCommandRef = command as ArcCommand;

        // Modifier [to | by] dropdown
        inputsColumns.appendChild(buildSyntaxModifierDropdownCell(arcCommandRef.identifier, 'syntaxModifier', 'Mode', arcCommandRef.syntaxModifier, (newModifier: 'to' | 'by') => {
          arcCommandRef.syntaxModifier = newModifier;
          updateVisualClippedLayoutAndCanvas();
        }));

        // End point position coordinates
        inputsColumns.appendChild(buildNumericParameterControlCell(arcCommandRef.identifier, 'xCoordinate', currentLanguage === 'en' ? 'Anchor X' : 'Ancre X', arcCommandRef.xCoordinate, (newValue: number) => {
          arcCommandRef.xCoordinate = newValue;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildDropdownUnitParameterCell(arcCommandRef.identifier, 'horizontalUnit', currentLanguage === 'en' ? 'X Unit' : 'Unité X', arcCommandRef.horizontalUnit, (newUnit: Unit) => {
          arcCommandRef.horizontalUnit = newUnit;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildNumericParameterControlCell(arcCommandRef.identifier, 'yCoordinate', currentLanguage === 'en' ? 'Anchor Y' : 'Ancre Y', arcCommandRef.yCoordinate, (newValue: number) => {
          arcCommandRef.yCoordinate = newValue;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildDropdownUnitParameterCell(arcCommandRef.identifier, 'verticalUnit', currentLanguage === 'en' ? 'Y Unit' : 'Unité Y', arcCommandRef.verticalUnit, (newUnit: Unit) => {
          arcCommandRef.verticalUnit = newUnit;
          updateVisualClippedLayoutAndCanvas();
        }));

        // Radii definitions (RX, RY)
        inputsColumns.appendChild(buildNumericParameterControlCell(arcCommandRef.identifier, 'radiusX', currentLanguage === 'en' ? 'Radius X' : 'Rayon DX', arcCommandRef.radiusX, (newValue: number) => {
          arcCommandRef.radiusX = newValue;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildDropdownUnitParameterCell(arcCommandRef.identifier, 'radiusXUnit', currentLanguage === 'en' ? 'Radius X Unit' : 'Unité Rayon X', arcCommandRef.radiusXUnit, (newUnit: Unit) => {
          arcCommandRef.radiusXUnit = newUnit;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildNumericParameterControlCell(arcCommandRef.identifier, 'radiusY', currentLanguage === 'en' ? 'Radius Y' : 'Rayon DY', arcCommandRef.radiusY, (newValue: number) => {
          arcCommandRef.radiusY = newValue;
          updateVisualClippedLayoutAndCanvas();
        }));

        inputsColumns.appendChild(buildDropdownUnitParameterCell(arcCommandRef.identifier, 'radiusYUnit', currentLanguage === 'en' ? 'Radius Y Unit' : 'Unité Rayon Y', arcCommandRef.radiusYUnit, (newUnit: Unit) => {
          arcCommandRef.radiusYUnit = newUnit;
          updateVisualClippedLayoutAndCanvas();
        }));

        // Sweep options (large/small, cw/ccw, rot)
        const sizeCell = document.createElement('div');
        sizeCell.setAttribute('class', 'field-toggle-cell');
        
        const sizeLabel = document.createElement('span');
        sizeLabel.setAttribute('class', 'label-caption');
        sizeLabel.textContent = currentLanguage === 'en' ? 'Size' : 'Taille';

        const sizeSelect = document.createElement('select');
        sizeSelect.setAttribute('class', 'action-select-dropdown');
        sizeSelect.setAttribute('aria-label', currentLanguage === 'en' ? `Ellipse size of the arc for step ${index + 1}` : `Taille de l'ellipse de l'arc de l'étape ${index + 1}`);

        const smallOption = document.createElement('option');
        smallOption.value = 'small';
        smallOption.textContent = 'small';
        smallOption.selected = arcCommandRef.arcSize === 'small';

        const largeOption = document.createElement('option');
        largeOption.value = 'large';
        largeOption.textContent = 'large';
        largeOption.selected = arcCommandRef.arcSize === 'large';

        sizeSelect.appendChild(smallOption);
        sizeSelect.appendChild(largeOption);
        sizeCell.appendChild(sizeLabel);
        sizeCell.appendChild(sizeSelect);
        inputsColumns.appendChild(sizeCell);

        sizeSelect.addEventListener('change', () => {
          arcCommandRef.arcSize = sizeSelect.value as 'small' | 'large';
          updateVisualClippedLayoutAndCanvas();
        });

        const directionCell = document.createElement('div');
        directionCell.setAttribute('class', 'field-toggle-cell');

        const dirLabel = document.createElement('span');
        dirLabel.setAttribute('class', 'label-caption');
        dirLabel.textContent = currentLanguage === 'en' ? 'Direction' : 'Direction';

        const dirSelect = document.createElement('select');
        dirSelect.setAttribute('class', 'action-select-dropdown');
        dirSelect.setAttribute('aria-label', currentLanguage === 'en' ? `Rotation direction of the arc for step ${index + 1}` : `Sens de rotation de l'arc de l'étape ${index + 1}`);

        const cwOption = document.createElement('option');
        cwOption.value = 'cw';
        cwOption.textContent = currentLanguage === 'en' ? 'Clockwise (cw)' : 'Horaire (cw)';
        cwOption.selected = arcCommandRef.sweepDirection === 'cw';

        const ccwOption = document.createElement('option');
        ccwOption.value = 'ccw';
        ccwOption.textContent = currentLanguage === 'en' ? 'Counterclockwise (ccw)' : 'Antihoraire (ccw)';
        ccwOption.selected = arcCommandRef.sweepDirection === 'ccw';

        dirSelect.appendChild(cwOption);
        dirSelect.appendChild(ccwOption);
        directionCell.appendChild(dirLabel);
        directionCell.appendChild(dirSelect);
        inputsColumns.appendChild(directionCell);

        dirSelect.addEventListener('change', () => {
          arcCommandRef.sweepDirection = dirSelect.value as 'cw' | 'ccw';
          updateVisualClippedLayoutAndCanvas();
        });

        // Rotation degrees
        inputsColumns.appendChild(buildNumericParameterControlCell(arcCommandRef.identifier, 'rotationAngle', 'Rotation (deg)', arcCommandRef.rotationAngle, (newValue: number) => {
          arcCommandRef.rotationAngle = newValue;
          updateVisualClippedLayoutAndCanvas();
        }));
        break;
      }

      case 'close': {
        const closePrompt = document.createElement('p');
        closePrompt.setAttribute('class', 'close-command-meta-prompt');
        closePrompt.textContent = currentLanguage === 'en'
          ? 'Closes the clip path by drawing a straight line back to the starting point.'
          : 'Ferme le contour de découpe en traçant une ligne droite jusqu\'au point de départ.';
        inputsColumns.appendChild(closePrompt);
        break;
      }
    }

    commandCard.appendChild(inputsColumns);
    container.appendChild(commandCard);
  }
}

// Helper block generators for stable DOM inputs
function buildNumericParameterControlCell(
  commandId: string,
  suffixLabel: string,
  captionTitle: string,
  currentValue: number,
  onInputValueUpdate: (value: number) => void
): HTMLDivElement {
  const containerCell = document.createElement('div');
  containerCell.setAttribute('class', 'field-parameters-cell');

  const caption = document.createElement('span');
  caption.setAttribute('class', 'label-caption');
  caption.textContent = captionTitle;

  const numericInput = document.createElement('input');
  numericInput.setAttribute('type', 'number');
  numericInput.setAttribute('id', `input-${commandId}-${suffixLabel}`);
  numericInput.setAttribute('class', 'interactive-numeric-input');
  numericInput.setAttribute('value', currentValue.toString());
  numericInput.setAttribute('step', '1');
  numericInput.setAttribute('aria-label', `${captionTitle} de la commande`);

  numericInput.addEventListener('input', () => {
    let resultingNumber = parseFloat(numericInput.value);
    if (isNaN(resultingNumber)) {
      resultingNumber = 0;
    }
    onInputValueUpdate(resultingNumber);
  });

  containerCell.appendChild(caption);
  containerCell.appendChild(numericInput);
  return containerCell;
}

function buildDropdownUnitParameterCell(
  commandId: string,
  suffixLabel: string,
  captionTitle: string,
  currentUnit: Unit,
  onUnitValueUpdate: (unit: Unit) => void
): HTMLDivElement {
  const containerCell = document.createElement('div');
  containerCell.setAttribute('class', 'field-parameters-cell');

  const caption = document.createElement('span');
  caption.setAttribute('class', 'label-caption');
  caption.textContent = captionTitle;

  const unitSelector = document.createElement('select');
  unitSelector.setAttribute('class', 'unit-dropdown-selector');
  unitSelector.setAttribute('aria-label', `${captionTitle} de la coordonnee`);

  const pxOption = document.createElement('option');
  pxOption.setAttribute('value', 'px');
  pxOption.textContent = 'px';
  pxOption.selected = currentUnit === 'px';

  const percentOption = document.createElement('option');
  percentOption.setAttribute('value', '%');
  percentOption.textContent = '%';
  percentOption.selected = currentUnit === '%';

  const remOption = document.createElement('option');
  remOption.setAttribute('value', 'rem');
  remOption.textContent = 'rem';
  remOption.selected = currentUnit === 'rem';

  unitSelector.appendChild(pxOption);
  unitSelector.appendChild(percentOption);
  unitSelector.appendChild(remOption);
  containerCell.appendChild(caption);
  containerCell.appendChild(unitSelector);

  unitSelector.addEventListener('change', () => {
    onUnitValueUpdate(unitSelector.value as Unit);
  });

  return containerCell;
}

function buildSyntaxModifierDropdownCell(
  commandId: string,
  suffixLabel: string,
  captionTitle: string,
  currentModifier: 'to' | 'by',
  onModifierUpdate: (modifier: 'to' | 'by') => void
): HTMLDivElement {
  const containerCell = document.createElement('div');
  containerCell.setAttribute('class', 'field-toggle-cell');

  const caption = document.createElement('span');
  caption.setAttribute('class', 'label-caption');
  caption.textContent = captionTitle;

  const modifierSelect = document.createElement('select');
  modifierSelect.setAttribute('class', 'action-select-dropdown');
  modifierSelect.setAttribute('aria-label', `${captionTitle} syntaxModifier`);

  const toOption = document.createElement('option');
  toOption.setAttribute('value', 'to');
  toOption.textContent = currentLanguage === 'en' ? 'Absolute (to)' : 'Absolu (to)';
  toOption.selected = currentModifier === 'to';

  const byOption = document.createElement('option');
  byOption.setAttribute('value', 'by');
  byOption.textContent = currentLanguage === 'en' ? 'Relative (by)' : 'Relatif (by)';
  byOption.selected = currentModifier === 'by';

  modifierSelect.appendChild(toOption);
  modifierSelect.appendChild(byOption);
  containerCell.appendChild(caption);
  containerCell.appendChild(modifierSelect);

  modifierSelect.addEventListener('change', () => {
    onModifierUpdate(modifierSelect.value as 'to' | 'by');
  });

  return containerCell;
}

// ==========================================
// Operational Command Action Handlers
// ==========================================

function loadSelectedPresetTemplate(preset: ShapePreset): void {
  commandsStack = deepDuplicateStack(preset.commands);
  selectedCommandIdentifier = commandsStack[0].identifier;
  
  // Clean animated workflow references if presets are switched
  stateACommands = null;
  stateBCommands = null;
  refreshAnimationIndicatorsUI();

  stableRebuildCommandsSidebarDOM();
  updateVisualClippedLayoutAndCanvas();
  renderPresetButtonCardsList();

  const presetName = presetLocalizations[currentLanguage][shapePresets.indexOf(preset)]?.name || preset.name;
  announceToScreenReader(currentLanguage === 'en' ? `Preset loaded: ${presetName}` : `Préréglage chargé : ${presetName}`);
}

function createAndAppendCommandBlock(type: CommandType): void {
  const newIdentifier = `cmd-user-${Date.now()}`;
  let newCommand: ShapeCommand;

  // Find index of currently selected command
  let insertIndex = -1;
  if (selectedCommandIdentifier) {
    insertIndex = commandsStack.findIndex((cmd: ShapeCommand) => cmd.identifier === selectedCommandIdentifier);
  }

  // Derive logical coordinates based on the preceding point coordinates at output
  const matrix = computeWholeCoordinatesMatrix(commandsStack);
  
  let previousPoint: Coordinate;
  if (insertIndex !== -1 && insertIndex < matrix.length) {
    previousPoint = matrix[insertIndex].absoluteEnd;
  } else if (matrix.length > 0) {
    previousPoint = matrix[matrix.length - 1].absoluteEnd;
  } else {
    previousPoint = { xCoordinate: 100, yCoordinate: 100 };
  }
  
  // Decide placing coordinates offset slightly from preceding position to be highly visible
  const derivedX = Math.round(Math.min(360, Math.max(40, previousPoint.xCoordinate + 40)));
  const derivedY = Math.round(Math.min(360, Math.max(40, previousPoint.yCoordinate + 40)));

  switch (type) {
    case 'from':
      newCommand = { identifier: newIdentifier, type: 'from', xCoordinate: derivedX, yCoordinate: derivedY, horizontalUnit: 'px', verticalUnit: 'px' };
      break;
    case 'line':
      newCommand = { identifier: newIdentifier, type: 'line', syntaxModifier: 'to', xCoordinate: derivedX, yCoordinate: derivedY, horizontalUnit: 'px', verticalUnit: 'px' };
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
        firstControlCircle: { xCoordinate: Math.round((previousPoint.xCoordinate + derivedX) / 2), yCoordinate: previousPoint.yCoordinate },
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

  if (insertIndex !== -1) {
    const selectedCmd = commandsStack[insertIndex];
    if (selectedCmd.type === 'close') {
      commandsStack.splice(insertIndex, 0, newCommand);
    } else {
      commandsStack.splice(insertIndex + 1, 0, newCommand);
    }
  } else {
    // Double-check to insert lines or arcs before the existing close commands if any close exists!
    if (commandsStack.length > 1 && commandsStack[commandsStack.length - 1].type === 'close') {
      commandsStack.splice(commandsStack.length - 1, 0, newCommand);
    } else {
      commandsStack.push(newCommand);
    }
  }

  selectedCommandIdentifier = newIdentifier;
  stableRebuildCommandsSidebarDOM();
  updateVisualClippedLayoutAndCanvas();
  announceToScreenReader(currentLanguage === 'en' ? `Added step: ${newCommand.type}` : `Étape ajoutée : ${newCommand.type}`);
}

/**
 * Double clicking on the Canvas places a new node exactly where requested.
 */
function handleCanvasDoubleClick(logicalX: number, logicalY: number): void {
  const newIdentifier = `cmd-dbl-${Date.now()}`;
  const roundedX = Math.round(logicalX);
  const roundedY = Math.round(logicalY);

  const command: ShapeCommand = {
    identifier: newIdentifier,
    type: 'line',
    syntaxModifier: 'to',
    xCoordinate: roundedX,
    yCoordinate: roundedY,
    horizontalUnit: 'px',
    verticalUnit: 'px'
  };

  let insertIndex = -1;
  if (selectedCommandIdentifier) {
    insertIndex = commandsStack.findIndex((cmd: ShapeCommand) => cmd.identifier === selectedCommandIdentifier);
  }

  if (insertIndex !== -1) {
    const selectedCmd = commandsStack[insertIndex];
    if (selectedCmd.type === 'close') {
      commandsStack.splice(insertIndex, 0, command);
    } else {
      commandsStack.splice(insertIndex + 1, 0, command);
    }
  } else {
    // Safe insertion before the final close
    if (commandsStack.length > 1 && commandsStack[commandsStack.length - 1].type === 'close') {
      commandsStack.splice(commandsStack.length - 1, 0, command);
    } else {
      commandsStack.push(command);
    }
  }

  selectedCommandIdentifier = newIdentifier;
  stableRebuildCommandsSidebarDOM();
  updateVisualClippedLayoutAndCanvas();
  announceToScreenReader(currentLanguage === 'en' ? `Added point on canvas at X: ${roundedX}, Y: ${roundedY}` : `Point ajouté sur le canevas à l'emplacement X: ${roundedX}, Y: ${roundedY}`);
}

function removeCommandFromStack(commandIdentifier: string): void {
  // Safe filtering: you cannot delete the base starting "from" command
  const index = commandsStack.findIndex(command => command.identifier === commandIdentifier);
  if (index === 0) {
    return;
  }

  const deletedType = commandsStack[index].type;
  commandsStack.splice(index, 1);
  
  // Re-adjust focus selection
  if (selectedCommandIdentifier === commandIdentifier) {
    selectedCommandIdentifier = commandsStack.length > 0 ? commandsStack[0].identifier : null;
  }

  stableRebuildCommandsSidebarDOM();
  updateVisualClippedLayoutAndCanvas();
  announceToScreenReader(currentLanguage === 'en' ? `Removed step: ${deletedType}` : `Étape supprimée : ${deletedType}`);
}

function swapCommandsInStack(indexOne: number, indexTwo: number): void {
  if (indexOne < 1 || indexTwo < 1 || indexOne >= commandsStack.length || indexTwo >= commandsStack.length) {
    return; // Block messing with position 0 or out of bounds indices
  }

  // Block moving elements if close command of path should be kept at the end
  if (commandsStack[indexOne].type === 'close' || commandsStack[indexTwo].type === 'close') {
    return;
  }

  const temporaryPlaceholder = commandsStack[indexOne];
  commandsStack[indexOne] = commandsStack[indexTwo];
  commandsStack[indexTwo] = temporaryPlaceholder;

  stableRebuildCommandsSidebarDOM();
  updateVisualClippedLayoutAndCanvas();
  announceToScreenReader(currentLanguage === 'en' ? 'Step order updated' : 'Ordre des étapes mis à jour');
}

// ==========================================
// Copy to Clipboard Operations
// ==========================================

function copyGeneratedCodeToClipboard(): void {
  const cssStringCode = compileShapeCodeString(commandsStack);
  navigator.clipboard.writeText(cssStringCode).then(() => {
    // Show copy notification toast
    const toast = document.getElementById('copySuccessToast');
    if (toast) {
      toast.classList.add('visible-state');
      toast.setAttribute('aria-hidden', 'false');
      
      // Clear after 3 seconds
      setTimeout(() => {
        toast.classList.remove('visible-state');
        toast.setAttribute('aria-hidden', 'true');
      }, 3000);
    }
  });
}

// ==========================================
// Transition Animation Simulator Engine
// ==========================================

function saveCurrentStateForAnimation(slotSelection: 'A' | 'B'): void {
  if (slotSelection === 'A') {
    stateACommands = deepDuplicateStack(commandsStack);
  } else {
    stateBCommands = deepDuplicateStack(commandsStack);
  }

  refreshAnimationIndicatorsUI();
}

function refreshAnimationIndicatorsUI(): void {
  const indicatorAField = document.getElementById('indicatorStateA');
  const indicatorBField = document.getElementById('indicatorStateB');

  if (indicatorAField) {
    if (stateACommands) {
      indicatorAField.innerHTML = currentLanguage === 'en'
        ? `State A: <strong>${stateACommands.length} points saved</strong>`
        : `État A : <strong>${stateACommands.length} points enregistrés</strong>`;
    } else {
      indicatorAField.innerHTML = currentLanguage === 'en'
        ? `State A: <strong class="amber-highlight">Not saved</strong>`
        : `État A : <strong class="amber-highlight">Non enregistré</strong>`;
    }
  }

  if (indicatorBField) {
    if (stateBCommands) {
      indicatorBField.innerHTML = currentLanguage === 'en'
        ? `State B: <strong>${stateBCommands.length} points saved</strong>`
        : `État B : <strong>${stateBCommands.length} points enregistrés</strong>`;
    } else {
      indicatorBField.innerHTML = currentLanguage === 'en'
        ? `State B: <strong class="amber-highlight">Not saved</strong>`
        : `État B : <strong class="amber-highlight">Non enregistré</strong>`;
    }
  }

  // Compare shapes compatibility
  const triggerButton = document.getElementById('triggerTransitionTestButton') as HTMLButtonElement | null;
  if (triggerButton) {
    if (stateACommands && stateBCommands) {
      // Validate compatible lengths
      const lengthCheck = stateACommands.length === stateBCommands.length;
      let typesMatchCheck = true;
      
      if (lengthCheck) {
        for (let index = 0; index < stateACommands.length; index = index + 1) {
          if (stateACommands[index].type !== stateBCommands[index].type) {
            typesMatchCheck = false;
            break;
          }
        }
      }

      if (lengthCheck && typesMatchCheck) {
        triggerButton.disabled = false;
        triggerButton.textContent = currentLanguage === 'en' ? '▶ Play Animation' : '▶ Lancer l\'Animation';
      } else {
        triggerButton.disabled = true;
        triggerButton.textContent = currentLanguage === 'en' ? 'Incompatible (Different structures)' : 'Incompatible (Structures différentes)';
      }
    } else {
      triggerButton.disabled = true;
      triggerButton.textContent = currentLanguage === 'en' ? 'Save A and B to test' : 'Enregistrez A et B pour tester';
    }
  }
}

function performAnimationTransitionTest(): void {
  if (!stateACommands || !stateBCommands) {
    return;
  }

  const animationElement = document.getElementById('animatedClippedElement');
  const durationSlider = document.getElementById('animationDurationRange') as HTMLInputElement | null;
  const durationInSeconds = durationSlider ? durationSlider.value : '1.2';

  if (animationElement) {
    // Inject transition parameter
    animationElement.style.transition = `clip-path ${durationInSeconds}s cubic-bezier(0.4, 0, 0.2, 1)`;

    // Toggle between states back and forth to let the browser smoothly render the path shift
    const selectedStateSource = currentAnimationToggle === 'state_a' ? stateBCommands : stateACommands;
    currentAnimationToggle = currentAnimationToggle === 'state_a' ? 'state_b' : 'state_a';

    const cleanCss = compileShapeCodeString(selectedStateSource);
    const compiledClipValue = `shape(${cleanCss.replace('clip-path: shape(', '').slice(0, -2)})`;

    animationElement.style.clipPath = compiledClipValue;
  }
}

// ==========================================
// Setup Event listeners and Initializers
// ==========================================

function renderPresetButtonCardsList(): void {
  const container = document.getElementById('presetsGridContainer');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  for (let index = 0; index < shapePresets.length; index = index + 1) {
    const presetObj = shapePresets[index];
    const isCurrentActive = commandsStack.length === presetObj.commands.length &&
      (commandsStack[0] as FromCommand).xCoordinate === (presetObj.commands[0] as FromCommand).xCoordinate;

    const presetName = presetLocalizations[currentLanguage][index]?.name || presetObj.name;
    const presetDesc = presetLocalizations[currentLanguage][index]?.description || presetObj.description;

    const btnCard = document.createElement('button');
    btnCard.setAttribute('type', 'button');
    btnCard.setAttribute('class', `preset-item-card${isCurrentActive ? ' active-setting' : ''}`);
    btnCard.setAttribute('aria-label', currentLanguage === 'en' ? `Load preset ${presetName}` : `Charger le préréglage ${presetName}`);

    const nameTitle = document.createElement('span');
    nameTitle.setAttribute('class', 'preset-name');
    nameTitle.textContent = presetName;
    btnCard.appendChild(nameTitle);

    const descText = document.createElement('span');
    descText.setAttribute('class', 'preset-description');
    descText.textContent = presetDesc;
    btnCard.appendChild(descText);

    btnCard.addEventListener('click', () => {
      loadSelectedPresetTemplate(presetObj);
    });

    container.appendChild(btnCard);
  }
}

function initializeUIEventHandlers(): void {
  // Paintboard double-click handler
  const paintboard = document.getElementById('paintboard');
  if (paintboard) {
    paintboard.addEventListener('dblclick', (event: MouseEvent) => {
      // Don't trigger if clicked on child handles or circles
      if (event.target === paintboard || (event.target as HTMLElement).classList.contains('canvas-grid-lines')) {
        const boardRect = paintboard.getBoundingClientRect();
        const activeWidth = boardRect.width;
        const activeHeight = boardRect.height;
        const paddingLeft = boardRect.left;
        const paddingTop = boardRect.top;

        // Fetch click position relative inside the grid square
        const clickRatioX = (event.clientX - paddingLeft) / activeWidth;
        const clickRatioY = (event.clientY - paddingTop) / activeHeight;

        const logicalX = clickRatioX * 400;
        const logicalY = clickRatioY * 400;

        // Ensure we operate within the expected coordinate system
        handleCanvasDoubleClick(logicalX, logicalY);
      }
    });

    // Cursor position tracker
    paintboard.addEventListener('pointermove', (event: PointerEvent) => {
      const readout = document.getElementById('activeCoordinateReadout');
      if (readout) {
        const boardRect = paintboard.getBoundingClientRect();
        const activeWidth = boardRect.width;
        const activeHeight = boardRect.height;
        const paddingLeft = boardRect.left;
        const paddingTop = boardRect.top;

        const ratioX = (event.clientX - paddingLeft) / activeWidth;
        const ratioY = (event.clientY - paddingTop) / activeHeight;

        if (ratioX >= 0 && ratioX <= 1 && ratioY >= 0 && ratioY <= 1) {
          const logicalX = Math.round(ratioX * 400);
          const logicalY = Math.round(ratioY * 400);
          readout.textContent = currentLanguage === 'en'
            ? `Cursor: ${logicalX}px , ${logicalY}px (${Math.round(ratioX * 100)}% , ${Math.round(ratioY * 100)}%)`
            : `Curseur : ${logicalX}px , ${logicalY}px (${Math.round(ratioX * 100)}% , ${Math.round(ratioY * 100)}%)`;
        } else {
          readout.textContent = currentLanguage === 'en' ? 'Cursor: -- , --' : 'Curseur : -- , --';
        }
      }
    });

    paintboard.addEventListener('pointerleave', () => {
      const readout = document.getElementById('activeCoordinateReadout');
      if (readout) {
        readout.textContent = currentLanguage === 'en' ? 'Cursor: -- , --' : 'Curseur : -- , --';
      }
    });
  }

  // Background toggle handles
  const bgButtons = document.querySelectorAll('.background-toggle-group .action-toggle-button');
  bgButtons.forEach(button => {
    button.addEventListener('click', () => {
      bgButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      });
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');

      const bgType = button.getAttribute('data-background');
      const paintboardElement = document.getElementById('paintboard');
      const photoElement = document.getElementById('previewPhoto');

      if (paintboardElement) {
        // Remove old classes
        paintboardElement.className = 'draft-board';
        if (bgType === 'transparent') {
          paintboardElement.classList.add('bg-transparent');
        } else if (bgType === 'photo') {
          paintboardElement.classList.add('bg-photo');
        } else if (bgType === 'gradient') {
          paintboardElement.classList.add('bg-gradient');
        }
      }

      if (photoElement) {
        if (bgType === 'photo') {
          photoElement.classList.remove('hidden');
        } else {
          photoElement.classList.add('hidden');
        }
      }
    });
  });

  // Action buttons: Add command via toolbar panels
  const addCommandButtons = document.querySelectorAll('.command-creator-toolbar .add-command-btn');
  addCommandButtons.forEach(button => {
    button.addEventListener('click', () => {
      const presetType = button.getAttribute('data-preset-type') as CommandType;
      if (presetType) {
        createAndAppendCommandBlock(presetType);
      }
    });
  });

  // Batch conversions
  const convertPxBtn = document.getElementById('convertAllPxButton');
  if (convertPxBtn) {
    convertPxBtn.addEventListener('click', () => {
      batchConvertAllCoordinates('px');
    });
  }

  const convertPercentBtn = document.getElementById('convertAllPercentButton');
  if (convertPercentBtn) {
    convertPercentBtn.addEventListener('click', () => {
      batchConvertAllCoordinates('%');
    });
  }

  const convertRemBtn = document.getElementById('convertAllRemButton');
  if (convertRemBtn) {
    convertRemBtn.addEventListener('click', () => {
      batchConvertAllCoordinates('rem');
    });
  }

  const parentFontSizeInp = document.getElementById('parentFontSizeInput') as HTMLInputElement;
  if (parentFontSizeInp) {
    parentFontSizeInp.addEventListener('input', () => {
      let val = parseInt(parentFontSizeInp.value, 10);
      if (isNaN(val) || val <= 0) {
        return;
      }
      parentFontSize = val;
      // Re-trigger visual layout and update generate CSS shape code instantly!
      updateVisualClippedLayoutAndCanvas();
    });
  }

  // Copy Clipboard action
  const copyBtn = document.getElementById('copyClipboardCodeButton');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      copyGeneratedCodeToClipboard();
    });
  }

  // Control action utilities
  const resetBtn = document.getElementById('resetPointsButton');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Re-load the Lionel Péramo bubble template
      loadSelectedPresetTemplate(shapePresets[0]);
    });
  }

  const clearBtn = document.getElementById('clearAllPointsButton');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      commandsStack = [
        { identifier: 'cmd-clear-1', type: 'from', xCoordinate: 200, yCoordinate: 200, horizontalUnit: 'px', verticalUnit: 'px' }
      ];
      selectedCommandIdentifier = commandsStack[0].identifier;
      stableRebuildCommandsSidebarDOM();
      updateVisualClippedLayoutAndCanvas();
    });
  }

  // Animation Workspace actions
  const saveAButton = document.getElementById('saveStateAButton');
  if (saveAButton) {
    saveAButton.addEventListener('click', () => {
      saveCurrentStateForAnimation('A');
    });
  }

  const saveBButton = document.getElementById('saveStateBButton');
  if (saveBButton) {
    saveBButton.addEventListener('click', () => {
      saveCurrentStateForAnimation('B');
    });
  }

  const rangeSlider = document.getElementById('animationDurationRange') as HTMLInputElement | null;
  const durationText = document.getElementById('durationValueOutput');
  if (rangeSlider && durationText) {
    rangeSlider.addEventListener('input', () => {
      durationText.textContent = rangeSlider.value;
    });
  }

  const playBtn = document.getElementById('triggerTransitionTestButton');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      performAnimationTransitionTest();
    });
  }
}

// ==========================================
// Initialization Entry Point on Loader
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
  // Set up background default
  const paintboard = document.getElementById('paintboard');
  if (paintboard) {
    paintboard.classList.add('bg-transparent');
  }

  // Hook up theme switcher buttons
  const themeBtns = document.querySelectorAll('.theme-switcher-group .theme-btn');
  const applyTheme = (targetTheme: 'dark' | 'light') => {
    if (targetTheme === 'light') {
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    } else {
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    }
    
    themeBtns.forEach(btn => {
      const btnTheme = btn.getAttribute('data-theme');
      if (btnTheme === targetTheme) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    localStorage.setItem('theme', targetTheme);
  };

  // Get saved theme or detect preferred color scheme (fallback to dark)
  const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
  let initialTheme: 'dark' | 'light' = 'dark';
  if (savedTheme === 'dark' || savedTheme === 'light') {
    initialTheme = savedTheme;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    initialTheme = 'light';
  }
  applyTheme(initialTheme);

  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedTheme = btn.getAttribute('data-theme') as 'dark' | 'light';
      if (selectedTheme) {
        applyTheme(selectedTheme);
      }
    });
  });

  // Hook up language switcher segmented buttons
  const switcherBtns = document.querySelectorAll('.language-switcher .lang-btn');
  switcherBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedLanguage = btn.getAttribute('data-lang') as 'en' | 'fr';
      if (selectedLanguage && selectedLanguage !== currentLanguage) {
        currentLanguage = selectedLanguage;
        switcherBtns.forEach(otherBtn => {
          if (otherBtn === btn) {
            otherBtn.classList.add('active');
          } else {
            otherBtn.classList.remove('active');
          }
        });
        
        translatePageHTML();
        stableRebuildCommandsSidebarDOM();
        renderPresetButtonCardsList();
        refreshAnimationIndicatorsUI();
        updateVisualClippedLayoutAndCanvas();
      }
    });
  });

  // Load the Speech bubble ("Bulle de discussion") as the initial starting workflow
  loadSelectedPresetTemplate(shapePresets[0]);

  // Pre-load default slot values for transition to let user test immediately
  stateACommands = deepDuplicateStack(shapePresets[0].commands);
  
  // State B represents a modified speech bubble with some changes
  const modifiedPresetB = deepDuplicateStack(shapePresets[0].commands);
  // Modify some coordinates to make the transition obviously visible on play
  if (modifiedPresetB.length > 7) {
    // shift tip and height down
    (modifiedPresetB[6] as any).yCoordinate = 390; // Tip curves down to the bottom
    (modifiedPresetB[7] as any).yCoordinate = 260;
  }
  stateBCommands = modifiedPresetB;

  // Initialize all interactive buttons and cursors trackers
  initializeUIEventHandlers();

  // Run initial HTML translations
  translatePageHTML();

  // Render list of preset templates
  renderPresetButtonCardsList();
  refreshAnimationIndicatorsUI();

  // Register window resize listener for clip-path scaling alignment
  window.addEventListener('resize', adjustClippedElementScale);
});

/**
 * Sends a polite verbal notification to screen readers via an aria-live div.
 */
function announceToScreenReader(message: string): void {
  const announcer = document.getElementById('srLiveAnnouncer');
  if (announcer) {
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 50);
  }
}
