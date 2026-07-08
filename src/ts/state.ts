import { ShapeCommand } from './types.js';

export const state = {
  commandsStack: [] as ShapeCommand[],
  selectedCommandIdentifier: null as string | null,
  initialStateCommands: null as ShapeCommand[] | null,
  finalStateCommands: null as ShapeCommand[] | null,
  currentSelectedCodeTab: 'static' as 'static' | 'animation',
  parentFontSize: 16,
  isCurrentlyDragging: false,
  currentLanguage: 'en' as 'en' | 'fr',
  activePresetIndex: null as number | null
};