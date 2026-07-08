/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
  Coordinate,
  ShapeCommand,
  Unit,
  FromCommand,
  LineCommand,
  HorizontalLineCommand,
  VerticalLineCommand,
  CurveCommand,
  ArcCommand
} from './types.js';
import { state } from './state.js';
import { updateVisualClippedLayoutAndCanvas } from './canvas.js';
import { announceToScreenReader } from './main.js';

type AllowedNumericKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T] & string;

type AllowedUnitKeys<T> = {
  [K in keyof T]: T[K] extends Unit ? K : never;
}[keyof T] & string;

type AllowedSyntaxKeys<T> = {
  [K in keyof T]: T[K] extends 'to' | 'by' ? K : never;
}[keyof T] & string;

/**
 * Creates a standard form field container with its caption label.
 */
export function createFieldWrapper(
  captionTitle: string,
  useToggleStyle: boolean = false
): { container: HTMLDivElement; label: HTMLSpanElement }
{
  const container = document.createElement('div');

  container.setAttribute(
    'class',
    useToggleStyle ? 'field-toggle-cell' : 'field-parameters-cell'
  );

  const label = document.createElement('span');
  label.setAttribute('class', 'label-caption');
  label.textContent = captionTitle;

  container.appendChild(label);

  return {
    container,
    label
  };
}

/**
 * Iterates through the stack of commands sequentially, and builds the sidebar DOM.
 */
export function stableRebuildCommandsSidebarDOM(): void
{
  const container = document.getElementById('commandsListStack');

  if (!container)
    return;

  container.innerHTML = '';

  for (let index = 0; index < state.commandsStack.length; index = index + 1)
  {
    const
      command = state.commandsStack[index],
      isFirstCommand = index === 0,
      isLastCommand = index === state.commandsStack.length - 1;

    let isSecondToLast = false;

    if (state.commandsStack.length > 2 && state.commandsStack[state.commandsStack.length - 1].type === 'close')
      isSecondToLast = index === state.commandsStack.length - 2;

    const commandCard = document.createElement('div');
    commandCard.setAttribute(
      'class',
      `command-item-card${state.selectedCommandIdentifier === command.identifier
        ? ' selected-active'
        : ''
      }`
    );
    commandCard.setAttribute('data-id', command.identifier);
    commandCard.setAttribute('role', 'listitem');

    commandCard.addEventListener('click', (event: MouseEvent) =>
    {
      const targetTag = (event.target as HTMLElement).tagName.toLowerCase();

      if (targetTag !== 'input' && targetTag !== 'select' && targetTag !== 'button')
        setFocusedActiveCommand(command.identifier);
    });

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

    const headerActionsGroup = document.createElement('div');
    headerActionsGroup.setAttribute('class', 'header-actions-group');

    const arrowUp = document.createElement('button');
    arrowUp.setAttribute('type', 'button');
    arrowUp.setAttribute('class', 'reorder-arrow-btn');
    arrowUp.setAttribute(
      'aria-label',
      state.currentLanguage === 'en'
        ? `Move command ${index + 1} up`
        : `Déplacer la commande ${index + 1} vers le haut`
    );
    arrowUp.innerHTML = '▲';
    arrowUp.disabled = isFirstCommand || index === 1;
    arrowUp.addEventListener('click', (event: MouseEvent) =>
    {
      event.stopPropagation();
      swapCommandsInStack(index, index - 1);
    });
    headerActionsGroup.appendChild(arrowUp);

    const arrowDown = document.createElement('button');
    arrowDown.setAttribute('type', 'button');
    arrowDown.setAttribute('class', 'reorder-arrow-btn');
    arrowDown.setAttribute(
      'aria-label',
      state.currentLanguage === 'en'
        ? `Move command ${index + 1} down`
        : `Déplacer l'étape ${index + 1} vers le bas`
    );
    arrowDown.innerHTML = '▼';
    arrowDown.disabled = isLastCommand || isSecondToLast || (command.type === 'close');
    arrowDown.addEventListener('click', (event: MouseEvent) =>
    {
      event.stopPropagation();
      swapCommandsInStack(index, index + 1);
    });
    headerActionsGroup.appendChild(arrowDown);

    const deleteButton = document.createElement('button');
    deleteButton.setAttribute('type', 'button');
    deleteButton.setAttribute('class', 'delete-row-btn');
    deleteButton.setAttribute(
      'aria-label',
      state.currentLanguage === 'en'
        ? `Delete command step ${index + 1}`
        : `Supprimer l'étape de commande ${index + 1}`
    );
    deleteButton.innerHTML = '✕';
    deleteButton.disabled = isFirstCommand;
    deleteButton.addEventListener('click', (event: MouseEvent) =>
    {
      event.stopPropagation();
      removeCommandFromStack(command.identifier);
    });
    headerActionsGroup.appendChild(deleteButton);

    cardHeader.appendChild(headerActionsGroup);
    commandCard.appendChild(cardHeader);

    const inputsColumns = document.createElement('div');
    inputsColumns.setAttribute('class', 'inputs-columns-layout');

    switch (command.type)
    {
      case 'from':
      {
        const fromCommandReference = command as FromCommand;

        inputsColumns.appendChild(buildNumericParameterControlCell(fromCommandReference, fromCommandReference, 'xCoordinate', 'xCoordinate', 'X (horiz)'));
        inputsColumns.appendChild(buildDropdownUnitParameterCell(fromCommandReference, fromCommandReference, 'horizontalUnit', 'horizontalUnit', state.currentLanguage === 'en' ? 'X Unit' : 'Unité X'));
        inputsColumns.appendChild(buildNumericParameterControlCell(fromCommandReference, fromCommandReference, 'yCoordinate', 'yCoordinate', 'Y (vrt)'));
        inputsColumns.appendChild(buildDropdownUnitParameterCell(fromCommandReference, fromCommandReference, 'verticalUnit', 'verticalUnit', state.currentLanguage === 'en' ? 'Y Unit' : 'Unité Y'));
        break;
      }

      case 'line':
      {
        const lineCommandReference = command as LineCommand;

        inputsColumns.appendChild(buildSyntaxModifierDropdownCell(lineCommandReference, 'syntaxModifier', 'Mode'));
        inputsColumns.appendChild(buildNumericParameterControlCell(lineCommandReference, lineCommandReference, 'xCoordinate', 'xCoordinate', 'X'));
        inputsColumns.appendChild(buildDropdownUnitParameterCell(lineCommandReference, lineCommandReference, 'horizontalUnit', 'horizontalUnit', state.currentLanguage === 'en' ? 'X Unit' : 'Unité X'));
        inputsColumns.appendChild(buildNumericParameterControlCell(lineCommandReference, lineCommandReference, 'yCoordinate', 'yCoordinate', 'Y'));
        inputsColumns.appendChild(buildDropdownUnitParameterCell(lineCommandReference, lineCommandReference, 'verticalUnit', 'verticalUnit', state.currentLanguage === 'en' ? 'Y Unit' : 'Unité Y'));
        break;
      }

      case 'hline':
      {
        const hlineCommandReference = command as HorizontalLineCommand;

        inputsColumns.appendChild(buildSyntaxModifierDropdownCell(hlineCommandReference, 'syntaxModifier', 'Mode'));
        inputsColumns.appendChild(buildNumericParameterControlCell(hlineCommandReference, hlineCommandReference, 'value', 'value', state.currentLanguage === 'en' ? 'Value' : 'Valeur'));
        inputsColumns.appendChild(buildDropdownUnitParameterCell(hlineCommandReference, hlineCommandReference, 'unit', 'unit', state.currentLanguage === 'en' ? 'Unit' : 'Unité'));
        break;
      }

      case 'vline':
      {
        const vlineCommandReference = command as VerticalLineCommand;

        inputsColumns.appendChild(buildSyntaxModifierDropdownCell(vlineCommandReference, 'syntaxModifier', 'Mode'));
        inputsColumns.appendChild(buildNumericParameterControlCell(vlineCommandReference, vlineCommandReference, 'value', 'value', state.currentLanguage === 'en' ? 'Value' : 'Valeur'));
        inputsColumns.appendChild(buildDropdownUnitParameterCell(vlineCommandReference, vlineCommandReference, 'unit', 'unit', state.currentLanguage === 'en' ? 'Unit' : 'Unité'));
        break;
      }

      case 'curve':
      {
        const curveCommandReference = command as CurveCommand;

        inputsColumns.appendChild(buildSyntaxModifierDropdownCell(curveCommandReference, 'syntaxModifier', 'Mode'));
        inputsColumns.appendChild(buildNumericParameterControlCell(curveCommandReference, curveCommandReference, 'xCoordinate', 'xCoordinate', state.currentLanguage === 'en' ? 'End X' : 'Fin X'));
        inputsColumns.appendChild(buildDropdownUnitParameterCell(curveCommandReference, curveCommandReference, 'horizontalUnit', 'horizontalUnit', state.currentLanguage === 'en' ? 'End X Unit' : 'Unité Fin X'));
        inputsColumns.appendChild(buildNumericParameterControlCell(curveCommandReference, curveCommandReference, 'yCoordinate', 'yCoordinate', state.currentLanguage === 'en' ? 'End Y' : 'Fin Y'));
        inputsColumns.appendChild(buildDropdownUnitParameterCell(curveCommandReference, curveCommandReference, 'verticalUnit', 'verticalUnit', state.currentLanguage === 'en' ? 'End Y Unit' : 'Unité Fin Y'));

        inputsColumns.appendChild(buildNumericParameterControlCell(curveCommandReference, curveCommandReference.firstControlCircle, 'xCoordinate', 'firstControlCircle-xCoordinate', 'Ctrl1 X'));
        inputsColumns.appendChild(buildDropdownUnitParameterCell(curveCommandReference, curveCommandReference, 'firstControlHorizontalUnit', 'firstControlHorizontalUnit', state.currentLanguage === 'en' ? 'Ctrl1 X Unit' : 'Unité Ctrl1 X'));
        inputsColumns.appendChild(buildNumericParameterControlCell(curveCommandReference, curveCommandReference.firstControlCircle, 'yCoordinate', 'firstControlCircle-yCoordinate', 'Ctrl1 Y'));
        inputsColumns.appendChild(buildDropdownUnitParameterCell(curveCommandReference, curveCommandReference, 'firstControlVerticalUnit', 'firstControlVerticalUnit', state.currentLanguage === 'en' ? 'Ctrl1 Y Unit' : 'Unité Ctrl1 Y'));

        const controlToggleCell = document.createElement('div');
        controlToggleCell.setAttribute('class', 'field-toggle-cell');

        const controlLabel = document.createElement('span');
        controlLabel.setAttribute('class', 'label-caption');
        controlLabel.textContent = state.currentLanguage === 'en' ? 'Curve' : 'Courbe';

        const controlSelect = document.createElement('select');
        controlSelect.setAttribute('class', 'action-select-dropdown');
        controlSelect.setAttribute(
          'aria-label',
          state.currentLanguage === 'en'
            ? `Curve type for step ${index + 1}`
            : `Type de courbe pour l'étape ${index + 1}`
        );

        const quadraticOption = document.createElement('option');
        quadraticOption.value = 'quadratic';
        quadraticOption.textContent = state.currentLanguage === 'en' ? 'Quadratic (1 Ctrl)' : 'Quadratique (1 Ctrl)';
        quadraticOption.selected = !curveCommandReference.hasSecondControlCircle;

        const cubicOption = document.createElement('option');
        cubicOption.value = 'cubic';
        cubicOption.textContent = state.currentLanguage === 'en' ? 'Cubic (2 Ctrl)' : 'Cubique (2 Ctrl)';
        cubicOption.selected = curveCommandReference.hasSecondControlCircle;

        controlSelect.appendChild(quadraticOption);
        controlSelect.appendChild(cubicOption);
        controlToggleCell.appendChild(controlLabel);
        controlToggleCell.appendChild(controlSelect);
        inputsColumns.appendChild(controlToggleCell);

        controlSelect.addEventListener('change', () =>
        {
          const isSelectedCubic = controlSelect.value === 'cubic';
          curveCommandReference.hasSecondControlCircle = isSelectedCubic;

          if (isSelectedCubic
            && curveCommandReference.secondControlCircle.xCoordinate === 0
            && curveCommandReference.secondControlCircle.yCoordinate === 0)
          {
            curveCommandReference.secondControlCircle.xCoordinate = Math.round(curveCommandReference.xCoordinate * 0.8);
            curveCommandReference.secondControlCircle.yCoordinate = Math.round(curveCommandReference.yCoordinate * 0.8);
            curveCommandReference.secondControlHorizontalUnit = curveCommandReference.horizontalUnit;
            curveCommandReference.secondControlVerticalUnit = curveCommandReference.verticalUnit;
          }

          stableRebuildCommandsSidebarDOM();
          updateVisualClippedLayoutAndCanvas();
        });

        if (curveCommandReference.hasSecondControlCircle)
        {
          inputsColumns.appendChild(buildNumericParameterControlCell(curveCommandReference, curveCommandReference.secondControlCircle, 'xCoordinate', 'secondControlCircle-xCoordinate', 'Ctrl2 X'));
          inputsColumns.appendChild(buildDropdownUnitParameterCell(curveCommandReference, curveCommandReference, 'secondControlHorizontalUnit', 'secondControlHorizontalUnit', state.currentLanguage === 'en' ? 'Ctrl2 X Unit' : 'Unité Ctrl2 X'));
          inputsColumns.appendChild(buildNumericParameterControlCell(curveCommandReference, curveCommandReference.secondControlCircle, 'yCoordinate', 'secondControlCircle-yCoordinate', 'Ctrl2 Y'));
          inputsColumns.appendChild(buildDropdownUnitParameterCell(curveCommandReference, curveCommandReference, 'secondControlVerticalUnit', 'secondControlVerticalUnit', state.currentLanguage === 'en' ? 'Ctrl2 Y Unit' : 'Unité Ctrl2 Y'));
        }
        break;
      }

      case 'arc':
      {
        const arcCommandReference = command as ArcCommand;

        inputsColumns.appendChild(buildSyntaxModifierDropdownCell(arcCommandReference, 'syntaxModifier', 'Mode'));
        inputsColumns.appendChild(buildNumericParameterControlCell(arcCommandReference, arcCommandReference, 'xCoordinate', 'xCoordinate', state.currentLanguage === 'en' ? 'Anchor X' : 'Ancre X'));
        inputsColumns.appendChild(buildDropdownUnitParameterCell(arcCommandReference, arcCommandReference, 'horizontalUnit', 'horizontalUnit', state.currentLanguage === 'en' ? 'X Unit' : 'Unité X'));
        inputsColumns.appendChild(buildNumericParameterControlCell(arcCommandReference, arcCommandReference, 'yCoordinate', 'yCoordinate', state.currentLanguage === 'en' ? 'Anchor Y' : 'Ancre Y'));
        inputsColumns.appendChild(buildDropdownUnitParameterCell(arcCommandReference, arcCommandReference, 'verticalUnit', 'verticalUnit', state.currentLanguage === 'en' ? 'Y Unit' : 'Unité Y'));

        inputsColumns.appendChild(buildNumericParameterControlCell(arcCommandReference, arcCommandReference, 'radiusX', 'radiusX', state.currentLanguage === 'en' ? 'Radius X' : 'Rayon DX'));
        inputsColumns.appendChild(buildDropdownUnitParameterCell(arcCommandReference, arcCommandReference, 'radiusXUnit', 'radiusXUnit', state.currentLanguage === 'en' ? 'Radius X Unit' : 'Unité Rayon X'));
        inputsColumns.appendChild(buildNumericParameterControlCell(arcCommandReference, arcCommandReference, 'radiusY', 'radiusY', state.currentLanguage === 'en' ? 'Radius Y' : 'Rayon DY'));
        inputsColumns.appendChild(buildDropdownUnitParameterCell(arcCommandReference, arcCommandReference, 'radiusYUnit', 'radiusYUnit', state.currentLanguage === 'en' ? 'Radius Y Unit' : 'Unité Rayon Y'));

        const sizeCell = document.createElement('div');
        sizeCell.setAttribute('class', 'field-toggle-cell');

        const sizeLabel = document.createElement('span');
        sizeLabel.setAttribute('class', 'label-caption');
        sizeLabel.textContent = state.currentLanguage === 'en' ? 'Size' : 'Taille';

        const sizeSelect = document.createElement('select');
        sizeSelect.setAttribute('class', 'action-select-dropdown');
        sizeSelect.setAttribute(
          'aria-label',
          state.currentLanguage === 'en'
            ? `Ellipse size of the arc for step ${index + 1}`
            : `Taille de l'ellipse de l'arc de l'étape ${index + 1}`
        );

        const smallOption = document.createElement('option');
        smallOption.value = 'small';
        smallOption.textContent = 'small';
        smallOption.selected = arcCommandReference.arcSize === 'small';

        const largeOption = document.createElement('option');
        largeOption.value = 'large';
        largeOption.textContent = 'large';
        largeOption.selected = arcCommandReference.arcSize === 'large';

        sizeSelect.appendChild(smallOption);
        sizeSelect.appendChild(largeOption);
        sizeCell.appendChild(sizeLabel);
        sizeCell.appendChild(sizeSelect);
        inputsColumns.appendChild(sizeCell);

        sizeSelect.addEventListener('change', () =>
        {
          arcCommandReference.arcSize = sizeSelect.value as 'small' | 'large';
          updateVisualClippedLayoutAndCanvas();
        });

        const directionCell = document.createElement('div');
        directionCell.setAttribute('class', 'field-toggle-cell');

        const directionLabel = document.createElement('span');
        directionLabel.setAttribute('class', 'label-caption');
        directionLabel.textContent = state.currentLanguage === 'en' ? 'Direction' : 'Direction';

        const directionSelect = document.createElement('select');
        directionSelect.setAttribute('class', 'action-select-dropdown');
        directionSelect.setAttribute(
          'aria-label',
          state.currentLanguage === 'en'
            ? `Rotation direction of the arc for step ${index + 1}`
            : `Sens de rotation de l'arc de l'étape ${index + 1}`
        );

        const cwOption = document.createElement('option');
        cwOption.value = 'cw';
        cwOption.textContent = state.currentLanguage === 'en' ? 'Clockwise (cw)' : 'Horaire (cw)';
        cwOption.selected = arcCommandReference.sweepDirection === 'cw';

        const ccwOption = document.createElement('option');
        ccwOption.value = 'ccw';
        ccwOption.textContent = state.currentLanguage === 'en' ? 'Counterclockwise (ccw)' : 'Antihoraire (ccw)';
        ccwOption.selected = arcCommandReference.sweepDirection === 'ccw';

        directionSelect.appendChild(cwOption);
        directionSelect.appendChild(ccwOption);
        directionCell.appendChild(directionLabel);
        directionCell.appendChild(directionSelect);
        inputsColumns.appendChild(directionCell);

        directionSelect.addEventListener('change', () =>
        {
          arcCommandReference.sweepDirection = directionSelect.value as 'cw' | 'ccw';
          updateVisualClippedLayoutAndCanvas();
        });

        inputsColumns.appendChild(buildNumericParameterControlCell(arcCommandReference, arcCommandReference, 'rotationAngle', 'rotationAngle', 'Rotation (deg)'));
        break;
      }

      case 'close':
      {
        const closePrompt = document.createElement('p');
        closePrompt.setAttribute('class', 'close-command-meta-prompt');
        closePrompt.textContent = state.currentLanguage === 'en'
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

export function buildNumericParameterControlCell<T extends ShapeCommand | Coordinate>(
  command: ShapeCommand,
  targetObject: T,
  propertyKey: AllowedNumericKeys<T>,
  idSuffix: string,
  captionTitle: string
): HTMLDivElement
{
  const
    { container } = createFieldWrapper(captionTitle),
    numericInput = document.createElement('input');

  numericInput.setAttribute('type', 'number');
  numericInput.setAttribute('id', `input-${command.identifier}-${idSuffix}`);
  numericInput.setAttribute('class', 'interactive-numeric-input');
  numericInput.setAttribute('value', String(targetObject[propertyKey]));
  numericInput.setAttribute('step', '1');
  numericInput.setAttribute('aria-label', `${captionTitle} de la commande`);

  numericInput.addEventListener('input', () =>
  {
    let resultingNumber = parseFloat(numericInput.value);

    if (isNaN(resultingNumber))
      resultingNumber = 0;

    const targetRecord = targetObject as unknown as Record<string, number>;
    targetRecord[propertyKey] = resultingNumber;
    updateVisualClippedLayoutAndCanvas();
  });

  container.appendChild(numericInput);

  return container;
}

export function buildDropdownUnitParameterCell<T extends ShapeCommand>(
  command: ShapeCommand,
  targetObject: T,
  propertyKey: AllowedUnitKeys<T>,
  idSuffix: string,
  captionTitle: string
): HTMLDivElement
{
  const
    { container } = createFieldWrapper(captionTitle),
    unitDropdownSelector = document.createElement('select');

  unitDropdownSelector.setAttribute('class', 'unit-dropdown-selector');
  unitDropdownSelector.setAttribute('aria-label', `${captionTitle} de la coordonnée`);

  const
    pixelOption = document.createElement('option'),
    percentOption = document.createElement('option'),
    remOption = document.createElement('option');

  pixelOption.setAttribute('value', 'px');
  pixelOption.textContent = 'px';
  pixelOption.selected = targetObject[propertyKey] === 'px';

  percentOption.setAttribute('value', '%');
  percentOption.textContent = '%';
  percentOption.selected = targetObject[propertyKey] === '%';

  remOption.setAttribute('value', 'rem');
  remOption.textContent = 'rem';
  remOption.selected = targetObject[propertyKey] === 'rem';

  unitDropdownSelector.appendChild(pixelOption);
  unitDropdownSelector.appendChild(percentOption);
  unitDropdownSelector.appendChild(remOption);
  container.appendChild(unitDropdownSelector);

  unitDropdownSelector.addEventListener('change', () =>
  {
    const targetRecord = targetObject as unknown as Record<string, Unit>;
    targetRecord[propertyKey] = unitDropdownSelector.value as Unit;
    updateVisualClippedLayoutAndCanvas();
  });

  return container;
}

export function buildSyntaxModifierDropdownCell<T extends ShapeCommand>(
  command: T,
  propertyKey: AllowedSyntaxKeys<T>,
  captionTitle: string
): HTMLDivElement
{
  const
    { container } = createFieldWrapper(captionTitle, true),
    modifierDropdownSelector = document.createElement('select');

  modifierDropdownSelector.setAttribute('class', 'action-select-dropdown');
  modifierDropdownSelector.setAttribute('aria-label', `${captionTitle} syntaxModifier`);

  const
    toOption = document.createElement('option'),
    byOption = document.createElement('option');

  toOption.setAttribute('value', 'to');
  toOption.textContent = state.currentLanguage === 'en' ? 'Absolute (to)' : 'Absolu (to)';
  toOption.selected = command[propertyKey] === 'to';

  byOption.setAttribute('value', 'by');
  byOption.textContent = state.currentLanguage === 'en' ? 'Relative (by)' : 'Relatif (by)';
  byOption.selected = command[propertyKey] === 'by';

  modifierDropdownSelector.appendChild(toOption);
  modifierDropdownSelector.appendChild(byOption);
  container.appendChild(modifierDropdownSelector);

  modifierDropdownSelector.addEventListener('change', () =>
  {
    const targetRecord = command as unknown as Record<string, 'to' | 'by'>;
    targetRecord[propertyKey] = modifierDropdownSelector.value as 'to' | 'by';
    updateVisualClippedLayoutAndCanvas();
  });

  return container;
}

export function stablePushCoordinateValueToSidebarInputs(
  commandIdentifier: string,
  inputPropertySuffix: string,
  newValue: number
): void
{
  const
    targetElementId = `input-${commandIdentifier}-${inputPropertySuffix}`,
    inputElement = document.getElementById(targetElementId) as HTMLInputElement | null;

  if (inputElement)
    inputElement.value = newValue.toString();
}

export function setFocusedActiveCommand(commandIdentifier: string | null): void
{
  state.selectedCommandIdentifier = commandIdentifier;

  const cards = document.querySelectorAll('.command-item-card');

  cards.forEach(card =>
  {
    card.classList.toggle('selected-active', card.getAttribute('data-id') === commandIdentifier);
  });

  const anchorGroups = document.querySelectorAll('.anchor-node-g');

  anchorGroups.forEach(group =>
  {
    group.classList.toggle(
      'selected-active',
      group.getAttribute('id') === `anchor-handle-${commandIdentifier}`
    );
  });
}

export function removeCommandFromStack(commandIdentifier: string): void
{
  const index = state.commandsStack.findIndex(command => command.identifier === commandIdentifier);

  if (index === 0)
    return;

  const deletedType = state.commandsStack[index].type;
  state.commandsStack.splice(index, 1);

  if (state.activePresetIndex !== null)
  {
    state.activePresetIndex = null;
    document.querySelector('.preset-item-card.active-setting')?.classList.remove('active-setting');
  }

  if (state.selectedCommandIdentifier === commandIdentifier)
  {
    state.selectedCommandIdentifier = state.commandsStack.length > 0
      ? state.commandsStack[0].identifier
      : null;
  }

  stableRebuildCommandsSidebarDOM();
  updateVisualClippedLayoutAndCanvas();
  announceToScreenReader(state.currentLanguage === 'en' ? `Removed step: ${deletedType}` : `Étape supprimée : ${deletedType}`);
}

export function swapCommandsInStack(indexOne: number, indexTwo: number): void
{
  if (indexOne < 1
    || indexTwo < 1
    || indexOne >= state.commandsStack.length
    || indexTwo >= state.commandsStack.length)
    return;

  if (state.commandsStack[indexOne].type === 'close'
    || state.commandsStack[indexTwo].type === 'close')
    return;

  if (state.activePresetIndex !== null)
  {
    state.activePresetIndex = null;
    document.querySelector('.preset-item-card.active-setting')?.classList.remove('active-setting');
  }

  const temporaryPlaceholder = state.commandsStack[indexOne];
  state.commandsStack[indexOne] = state.commandsStack[indexTwo];
  state.commandsStack[indexTwo] = temporaryPlaceholder;

  stableRebuildCommandsSidebarDOM();
  updateVisualClippedLayoutAndCanvas();
  announceToScreenReader(state.currentLanguage === 'en'
    ? 'Step order updated'
    : 'Ordre des étapes mis à jour'
  );
}