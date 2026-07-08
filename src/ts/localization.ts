/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { state } from './state.js';

export interface LanguageDictionary
{
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
  tab_static: string;
  tab_animation: string;
  how_it_works_title: string;
  how_it_works_body: string;
  toast_copied: string;
  btn_add_line: string;
  btn_add_hline: string;
  btn_add_vline: string;
  btn_add_curve: string;
  btn_add_arc: string;
  btn_add_close: string;
  aria_canvas_section: string;
  aria_bg_group: string;
  aria_config_section: string;
  aria_commands_list: string;
  footer_text: string;
  footer_link_blog: string;
}

export const localizationMatrix: Record<'en' | 'fr', LanguageDictionary> = {
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
    tab_static: 'Static shape()',
    tab_animation: 'CSS Animation',
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
    tab_static: 'shape() statique',
    tab_animation: 'Animation CSS',
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

export interface PresetTranslation
{
  name: string;
  description: string;
}

export const presetLocalizations: Record<'en' | 'fr', PresetTranslation[]> = {
  en: [
    { name: 'Speech bubble', description: 'A classic communication balloon with curved corners and a pointed tip.' },
    { name: 'Sacred Heart', description: 'Romantic drawing built using two cubic Bézier curves.' },
    { name: '5-point Star', description: 'An asymmetric geometric shape clipped into polygons.' },
    { name: 'National Shield', description: 'A majestic shape combining straight lines and curves.' },
    { name: 'Wave Banner', description: 'Beautiful layout header cut with a double waving ripple effect.' },
    { name: 'Octagonal Badge', description: 'A strict eight-sided geometric plaque.' },
    { name: 'Teardrop', description: 'A sleek, symmetrical teardrop shape drawn using smooth Bézier curves.' },
    { name: 'Crescent Moon', description: 'An elegant moon outline assembled with two intersecting Bézier curves.' },
    { name: 'Infinity Symbol', description: 'A fluid double curve loop representing geometric eternity.' },
    { name: 'Classic Hourglass', description: 'A sleek timeline silhouette pairing straight lines and inner curves.' },
    { name: 'Solar Eclipse Arc', description: 'A gorgeous layout showing off the precision of elliptical arc commands.' },
    { name: 'Triangle', description: 'A basic 3-sided polygon with clean coordinates.' },
    { name: 'Trapezoid', description: 'A classic 4-sided trapezoid symmetric silhouette.' },
    { name: 'Parallelogram', description: 'An elegant tilted 4-sided parallelogram shape.' },
    { name: 'Rhombus', description: 'A perfectly balanced diamond or rhombus shape.' },
    { name: 'Pentagon', description: 'A five-sided regular polygon silhouette.' },
    { name: 'Hexagon', description: 'A six-sided standard symmetrical polygon.' },
    { name: 'Heptagon', description: 'A seven-sided polygon with calculated corners.' },
    { name: 'Octagon', description: 'A symmetrical eight-sided polygon shape.' },
    { name: 'Nonagon', description: 'A complex nine-sided symmetrical polygon.' },
    { name: 'Decagon', description: 'A highly structured ten-sided symmetrical polygon.' },
    { name: 'Bevel', description: 'A square layout element cut symmetrically at every corner.' },
    { name: 'Rabbet', description: 'A decorative notched-corner geometric frame shape.' },
    { name: 'Left arrow', description: 'A classic signaling arrow pointing to the left.' },
    { name: 'Right arrow', description: 'A standard signaling arrow pointing to the right.' },
    { name: 'Left Point', description: 'A layout tag displaying a clean pointed tip on its left edge.' },
    { name: 'Right Point', description: 'A layout tag displaying a clean pointed tip on its right edge.' },
    { name: 'Left Chevron', description: 'A navigation chevron block pointing to the left.' },
    { name: 'Right Chevron', description: 'A navigation chevron block pointing to the right.' },
    { name: 'Cross', description: 'A classic symmetrical cross structure geometric layout.' },
    { name: 'Message', description: 'A sleek chat balloon with a pointed conversational indicator tail.' },
    { name: 'Close', description: 'The iconic standard close multiplication \'X\' structure.' },
    { name: 'Frame', description: 'A beautiful hollow double frame using a single nested outline path.' },
    { name: 'Inset', description: 'A centered, smaller rectangular viewport structure.' },
    { name: 'Circle', description: 'A perfect circular alignment built using dual elliptical arc commands.' },
    { name: 'Ellipse', description: 'A beautifully balanced ellipse stretched over offset semi-axes.' }
  ],
  fr: [
    { name: 'Bulle de discussion', description: 'Une bulle de communication classique aux coins arrondis et avec une pointe.' },
    { name: 'Cœur Sacré', description: 'Dessin romantique à l\'aide de deux courbes de Bézier cubiques.' },
    { name: 'Étoile à 5 branches', description: 'Une forme géométrique asymétrique découpée en polygones.' },
    { name: 'Bouclier National', description: 'Une forme majestueuse combinant lignes droites et arrondies.' },
    { name: 'Bannière Vague', description: 'Magnifique en-tête horizontal découpé avec une double ondulation.' },
    { name: 'Badge Octogonal', description: 'Une plaque géométrique stricte à huit côtés égale.' },
    { name: 'Goutte d\'eau', description: 'Une forme de larme lisse dessinée avec des courbes de Bézier lisses symétriques.' },
    { name: 'Croissant de lune', description: 'Un contour de lune élégant assemblé avec deux courbes de Bézier s\'entrecroisant.' },
    { name: 'Signe Infini', description: 'Un double nœud de courbe fluide représentant l\'éternité géométrique.' },
    { name: 'Sablier Classique', description: 'Une silhouette associée de lignes droites et de courbes intérieures lisses.' },
    { name: 'Éclipse Solaire', description: 'Un superbe tracé de cercle découpé illustrant la commande d\'arc elliptique.' },
    { name: 'Triangle', description: 'Un polygone de base à 3 côtés avec des coordonnées propres.' },
    { name: 'Trapèze', description: 'La silhouette symétrique classique d\'un trapèze à 4 côtés.' },
    { name: 'Parallélogramme', description: 'Une forme élégante inclinée à 4 côtés.' },
    { name: 'Losange', description: 'Un losange ou diamant parfaitement équilibré.' },
    { name: 'Pentagone', description: 'La silhouette d\'un polygone régulier à cinq côtés.' },
    { name: 'Hexagone', description: 'Un polygone symétrique standard à six côtés.' },
    { name: 'Heptagone', description: 'Un polygone à sept côtés avec des angles calculés.' },
    { name: 'Octogone', description: 'Une forme de polygone symétrique à huit côtés.' },
    { name: 'Nonagone', description: 'Un polygone symétrique complexe à neuf côtés.' },
    { name: 'Décagone', description: 'Un polygone symétrique hautement structuré à dix côtés.' },
    { name: 'Biseau', description: 'Un carré découpé symétriquement à chaque coin.' },
    { name: 'Feuillure', description: 'Un cadre géométrique décoratif aux angles encochés.' },
    { name: 'Flèche gauche', description: 'Une flèche de signalisation classique pointant vers la gauche.' },
    { name: 'Flèche droite', description: 'Une flèche de signalisation standard pointant vers la droite.' },
    { name: 'Pointe gauche', description: 'Une étiquette affichant une pointe nette sur son bord gauche.' },
    { name: 'Pointe droit', description: 'Une étiquette affichant une pointe nette sur son bord droit.' },
    { name: 'Chevron gauche', description: 'Un bloc de chevron de navigation pointant vers la gauche.' },
    { name: 'Chevron droit', description: 'Un bloc de chevron de navigation pointant vers la droite.' },
    { name: 'Croix', description: 'Une structure de croix latine symétrique classique.' },
    { name: 'Message', description: 'Un ballon de chat élégant avec une queue d\'indicateur pointpointed.' },
    { name: 'Fermer', description: 'La structure en croix \'X\' de fermeture classique.' },
    { name: 'Cadre', description: 'Un magnifique cadre double évidé utilisant un seul chemin imbriqué.' },
    { name: 'Encart', description: 'Une structure de fenêtre rectangulaire plus petite et centrée.' },
    { name: 'Cercle', description: 'Un cercle parfait construit à l\'aide de commandes d\'arc double.' },
    { name: 'Ellipse', description: 'Une ellipse joliment équilibrée étirée sur deux axes décalés.' }
  ]
};

function updateLocalizedElements(
  attributeName: string,
  updatePropertyCallback: (element: Element, translatedText: string) => void
): void
{
  const targetElements = document.querySelectorAll(`[${attributeName}]`);

  targetElements.forEach(element =>
  {
    const localizationKey = element.getAttribute(attributeName) as keyof LanguageDictionary;

    if (localizationKey && localizationMatrix[state.currentLanguage][localizationKey])
      updatePropertyCallback(element, localizationMatrix[state.currentLanguage][localizationKey]);
  });
}

export function translatePageHTML(): void
{
  document.documentElement.lang = state.currentLanguage;

  // Static standard textual blocks
  updateLocalizedElements('data-i18n', (element, translatedText) =>
  {
    element.textContent = translatedText;
  });

  // HTML content block placeholders
  updateLocalizedElements('data-i18n-html', (element, htmlContent) =>
  {
    element.innerHTML = htmlContent;
  });

  // Accessible aria attributes placeholders
  updateLocalizedElements('data-i18n-aria', (element, ariaLabel) =>
  {
    element.setAttribute('aria-label', ariaLabel);
  });
}