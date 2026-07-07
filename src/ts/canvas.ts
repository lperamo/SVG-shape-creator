/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Coordinate, CurveCommand, ShapeCommand, Unit } from './types.js';
import { state } from './state.js';
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
  stablePushCoordinateValueToSidebarInputs,
  stableRebuildCommandsSidebarDOM,
  setFocusedActiveCommand
} from './sidebar.js';
import { announceToScreenReader, toggleCollapsibleSection } from './main.js';

export interface ComputedCoordinates
{
  absoluteEnd: Coordinate;
  absoluteControlOne?: Coordinate;
  absoluteControlTwo?: Coordinate;
}

/**
 * Iterates through the stack of commands sequentially, and calculates
 * the physical coordinates (0-400px) of every anchor relative to standard grid size.
 */
export function computeWholeCoordinatesMatrix(commands: ShapeCommand[]): ComputedCoordinates[]
{
  const computedResultsList: ComputedCoordinates[] = [];
  let
    currentPositionX = 0,
    currentPositionY = 0,
    firstContourStartingPoint: Coordinate = { xCoordinate: 0, yCoordinate: 0 };

  for (let index = 0; index < commands.length; index = index + 1)
  {
    const currentCommand = commands[index];
    let
      absoluteEndX = currentPositionX,
      absoluteEndY = currentPositionY,
      absoluteControlOne: Coordinate | undefined,
      absoluteControlTwo: Coordinate | undefined;

    switch (currentCommand.type)
    {
      case 'from':
      {
        const
          xCoordinateValue = currentCommand.xCoordinate,
          yCoordinateValue = currentCommand.yCoordinate;

        absoluteEndX = convertUnitToPixels(xCoordinateValue, currentCommand.horizontalUnit);
        absoluteEndY = convertUnitToPixels(yCoordinateValue, currentCommand.verticalUnit);
        firstContourStartingPoint = {
          xCoordinate: absoluteEndX,
          yCoordinate: absoluteEndY
        };
        break;
      }

      case 'line':
      {
        const
          xCoordinateValue = currentCommand.xCoordinate,
          yCoordinateValue = currentCommand.yCoordinate,
          logicalTargetX = convertUnitToPixels(xCoordinateValue, currentCommand.horizontalUnit),
          logicalTargetY = convertUnitToPixels(yCoordinateValue, currentCommand.verticalUnit);

        if (currentCommand.syntaxModifier === 'to')
        {
          absoluteEndX = logicalTargetX;
          absoluteEndY = logicalTargetY;
        } else
        {
          absoluteEndX = currentPositionX + logicalTargetX;
          absoluteEndY = currentPositionY + logicalTargetY;
        }
        break;
      }

      case 'hline':
      {
        const
          targetValue = currentCommand.value,
          logicalTargetValue = convertUnitToPixels(targetValue, currentCommand.unit);

        absoluteEndX = (currentCommand.syntaxModifier === 'to')
          ? logicalTargetValue
          : currentPositionX + logicalTargetValue;

        absoluteEndY = currentPositionY;
        break;
      }

      case 'vline':
      {
        const
          targetValue = currentCommand.value,
          logicalTargetValue = convertUnitToPixels(targetValue, currentCommand.unit);

        absoluteEndX = currentPositionX;
        absoluteEndY = (currentCommand.syntaxModifier === 'to')
          ? logicalTargetValue
          : currentPositionY + logicalTargetValue;
        break;
      }

      case 'curve':
      {
        const
          targetXCoordinate = currentCommand.xCoordinate,
          targetYCoordinate = currentCommand.yCoordinate,
          logicalTargetEndX = convertUnitToPixels(targetXCoordinate, currentCommand.horizontalUnit),
          logicalTargetEndY = convertUnitToPixels(targetYCoordinate, currentCommand.verticalUnit),
          controlOneXValue = currentCommand.firstControlCircle.xCoordinate,
          controlOneYValue = currentCommand.firstControlCircle.yCoordinate;

        const
          logicalControlOneX = convertUnitToPixels(controlOneXValue, currentCommand.firstControlHorizontalUnit),
          logicalControlOneY = convertUnitToPixels(controlOneYValue, currentCommand.firstControlVerticalUnit);

        if (currentCommand.syntaxModifier === 'to')
        {
          absoluteEndX = logicalTargetEndX;
          absoluteEndY = logicalTargetEndY;
          absoluteControlOne = {
            xCoordinate: logicalControlOneX,
            yCoordinate: logicalControlOneY
          };

          if (currentCommand.hasSecondControlCircle)
          {
            const
              controlTwoXValue = currentCommand.secondControlCircle.xCoordinate,
              controlTwoYValue = currentCommand.secondControlCircle.yCoordinate,
              logicalControlTwoX = convertUnitToPixels(controlTwoXValue, currentCommand.secondControlHorizontalUnit),
              logicalControlTwoY = convertUnitToPixels(controlTwoYValue, currentCommand.secondControlVerticalUnit);

            absoluteControlTwo = {
              xCoordinate: logicalControlTwoX,
              yCoordinate: logicalControlTwoY
            };
          }
        } else
        {
          absoluteEndX = currentPositionX + logicalTargetEndX;
          absoluteEndY = currentPositionY + logicalTargetEndY;
          absoluteControlOne = {
            xCoordinate: currentPositionX + logicalControlOneX,
            yCoordinate: currentPositionY + logicalControlOneY
          };

          if (currentCommand.hasSecondControlCircle)
          {
            const
              controlTwoXValue = currentCommand.secondControlCircle.xCoordinate,
              controlTwoYValue = currentCommand.secondControlCircle.yCoordinate,
              logicalControlTwoX = convertUnitToPixels(controlTwoXValue, currentCommand.secondControlHorizontalUnit),
              logicalControlTwoY = convertUnitToPixels(controlTwoYValue, currentCommand.secondControlVerticalUnit);

            absoluteControlTwo = {
              xCoordinate: currentPositionX + logicalControlTwoX,
              yCoordinate: currentPositionY + logicalControlTwoY
            };
          }
        }
        break;
      }

      case 'arc':
      {
        const
          targetXCoordinate = currentCommand.xCoordinate,
          targetYCoordinate = currentCommand.yCoordinate,
          logicalTargetX = convertUnitToPixels(targetXCoordinate, currentCommand.horizontalUnit),
          logicalTargetY = convertUnitToPixels(targetYCoordinate, currentCommand.verticalUnit);

        if (currentCommand.syntaxModifier === 'to')
        {
          absoluteEndX = logicalTargetX;
          absoluteEndY = logicalTargetY;
        } else
        {
          absoluteEndX = currentPositionX + logicalTargetX;
          absoluteEndY = currentPositionY + logicalTargetY;
        }
        break;
      }

      case 'close':
      {
        absoluteEndX = firstContourStartingPoint.xCoordinate;
        absoluteEndY = firstContourStartingPoint.yCoordinate;
        break;
      }
    }

    computedResultsList.push({
      absoluteEnd: {
        xCoordinate: absoluteEndX,
        yCoordinate: absoluteEndY
      },
      absoluteControlOne: absoluteControlOne,
      absoluteControlTwo: absoluteControlTwo
    });

    currentPositionX = absoluteEndX;
    currentPositionY = absoluteEndY;
  }

  return computedResultsList;
}

/**
 * Scales the 400x400 clipped element block using CSS transforms, so that shape coordinates align exactly with SVG handlers.
 */
export function adjustClippedElementScale(): void
{
  const
    paintboard = document.getElementById('paintboard'),
    clippedElement = document.getElementById('clippedElement');

  if (paintboard && clippedElement)
  {
    const
      width = paintboard.clientWidth,
      scale = width / 400;

    clippedElement.style.transform = `scale(${scale})`;
    clippedElement.style.transformOrigin = 'top left';
  }
}

/**
 * Triggers rendering update on both the real-time cropped visual, the SVG canvas overlays, etc.
 */
export function updateVisualClippedLayoutAndCanvas(): void
{
  adjustClippedElementScale();

  const
    cssStringCode = compileShapeCodeString(state.commandsStack),
    codeOutputElement = document.getElementById('cssGeneratedCodeOutput');

  if (codeOutputElement)
  {
    codeOutputElement.textContent = (state.currentSelectedCodeTab === 'static')
      ? cssStringCode
      : compileCSSAnimationCodeString();
  }

  const clippedElement = document.getElementById('clippedElement');

  if (clippedElement)
    clippedElement.style.clipPath = `shape(${cssStringCode.replace('clip-path: shape(', '').slice(0, -2)})`;

  const
    coordinatesMatrix = computeWholeCoordinatesMatrix(state.commandsStack),
    visualPolyline = document.getElementById('visualConnectingPolyline') as unknown as SVGPathElement | null;

  if (visualPolyline)
  {
    let svgPathInstructions = '';

    for (let index = 0; index < coordinatesMatrix.length; index = index + 1)
    {
      const
        record = coordinatesMatrix[index],
        command = state.commandsStack[index],
        coordinateX = record.absoluteEnd.xCoordinate,
        coordinateY = record.absoluteEnd.yCoordinate;

      if (index === 0)
        svgPathInstructions = `M ${coordinateX} ${coordinateY}`;
      else
      {
        if (command.type === 'curve')
        {
          const
            controlOne = record.absoluteControlOne,
            controlTwo = record.absoluteControlTwo;

          if (controlOne && controlTwo)
            svgPathInstructions = `${svgPathInstructions} C ${controlOne.xCoordinate} ${controlOne.yCoordinate}, ${controlTwo.xCoordinate} ${controlTwo.yCoordinate}, ${coordinateX} ${coordinateY}`;
          else if (controlOne)
            svgPathInstructions = `${svgPathInstructions} Q ${controlOne.xCoordinate} ${controlOne.yCoordinate}, ${coordinateX} ${coordinateY}`;
          else
            svgPathInstructions = `${svgPathInstructions} L ${coordinateX} ${coordinateY}`;
        } else if (command.type === 'close')
          svgPathInstructions = `${svgPathInstructions} Z`;
        else
          svgPathInstructions = `${svgPathInstructions} L ${coordinateX} ${coordinateY}`;
      }
    }

    visualPolyline.setAttribute('d', svgPathInstructions);
  }

  if (state.isCurrentlyDragging)
    updateCanvasSvgInteractionHandles(coordinatesMatrix);
  else
    rebuildCanvasSvgInteractionHandles(coordinatesMatrix);

  const activeNodesCountField = document.getElementById('activeNodesReadout');

  if (activeNodesCountField)
  {
    activeNodesCountField.textContent = state.currentLanguage === 'en'
      ? `Commands: ${state.commandsStack.length}`
      : `Commandes : ${state.commandsStack.length}`;
  }
}

export function updateCanvasSvgInteractionHandles(coordinatesMatrix: ComputedCoordinates[]): void
{
  for (let index = 0; index < state.commandsStack.length; index = index + 1)
  {
    const
      command = state.commandsStack[index],
      absoluteRecord = coordinatesMatrix[index];

    if (command.type === 'close')
      continue;

    const previousAnchor = index > 0
      ? coordinatesMatrix[index - 1].absoluteEnd
      : { xCoordinate: 0, yCoordinate: 0 };

    const anchorGroup = document.getElementById(`anchor-handle-${command.identifier}`);

    if (anchorGroup)
    {
      const
        circles = anchorGroup.getElementsByTagName('circle'),
        endX = absoluteRecord.absoluteEnd.xCoordinate.toString(),
        endY = absoluteRecord.absoluteEnd.yCoordinate.toString();

      for (let circleIndex = 0; circleIndex < circles.length; circleIndex = circleIndex + 1)
      {
        circles[circleIndex].setAttribute('cx', endX);
        circles[circleIndex].setAttribute('cy', endY);
      }
    }

    if (command.type === 'curve' && absoluteRecord.absoluteControlOne)
    {
      const lineOne = document.getElementById(`line-one-${command.identifier}`);

      if (lineOne)
      {
        lineOne.setAttribute('x1', previousAnchor.xCoordinate.toString());
        lineOne.setAttribute('y1', previousAnchor.yCoordinate.toString());
        lineOne.setAttribute('x2', absoluteRecord.absoluteControlOne.xCoordinate.toString());
        lineOne.setAttribute('y2', absoluteRecord.absoluteControlOne.yCoordinate.toString());
      }

      const controlOneGroup = document.getElementById(`control-one-handle-${command.identifier}`);

      if (controlOneGroup)
      {
        const
          circles = controlOneGroup.getElementsByTagName('circle'),
          controlOneX = absoluteRecord.absoluteControlOne.xCoordinate.toString(),
          controlOneY = absoluteRecord.absoluteControlOne.yCoordinate.toString();

        for (let circleIndex = 0; circleIndex < circles.length; circleIndex = circleIndex + 1)
        {
          circles[circleIndex].setAttribute('cx', controlOneX);
          circles[circleIndex].setAttribute('cy', controlOneY);
        }
      }

      if (command.hasSecondControlCircle && absoluteRecord.absoluteControlTwo)
      {
        const lineTwo = document.getElementById(`line-two-${command.identifier}`);

        if (lineTwo)
        {
          lineTwo.setAttribute('x1', absoluteRecord.absoluteEnd.xCoordinate.toString());
          lineTwo.setAttribute('y1', absoluteRecord.absoluteEnd.yCoordinate.toString());
          lineTwo.setAttribute('x2', absoluteRecord.absoluteControlTwo.xCoordinate.toString());
          lineTwo.setAttribute('y2', absoluteRecord.absoluteControlTwo.yCoordinate.toString());
        }

        const controlTwoGroup = document.getElementById(`control-two-handle-${command.identifier}`);

        if (controlTwoGroup)
        {
          const
            circles = controlTwoGroup.getElementsByTagName('circle'),
            controlTwoX = absoluteRecord.absoluteControlTwo.xCoordinate.toString(),
            controlTwoY = absoluteRecord.absoluteControlTwo.yCoordinate.toString();

          for (let circleIndex = 0; circleIndex < circles.length; circleIndex = circleIndex + 1)
          {
            circles[circleIndex].setAttribute('cx', controlTwoX);
            circles[circleIndex].setAttribute('cy', controlTwoY);
          }
        }
      }
    }
  }
}

/**
 * Destroys and recreates interactive circular points & controls on the SVG workspace overlay.
 */
export function rebuildCanvasSvgInteractionHandles(coordinatesMatrix: ComputedCoordinates[]): void
{
  const
    markersContainer = document.getElementById('interactiveMarkersGroup'),
    auxiliaryContainer = document.getElementById('auxiliaryJointLinesGroup');

  if (!markersContainer || !auxiliaryContainer)
    return;

  const activeElementId = document.activeElement
    ? document.activeElement.id
    : null;

  markersContainer.innerHTML = '';
  auxiliaryContainer.innerHTML = '';

  for (let index = 0; index < state.commandsStack.length; index = index + 1)
  {
    const
      command = state.commandsStack[index],
      absoluteRecord = coordinatesMatrix[index];

    if (command.type === 'close')
      continue;

    const
      previousAnchor = index > 0
        ? coordinatesMatrix[index - 1].absoluteEnd
        : { xCoordinate: 0, yCoordinate: 0 },
      anchorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    anchorGroup.setAttribute(
      'class',
      `anchor-node-g${state.selectedCommandIdentifier === command.identifier ? ' selected-active' : ''}`
    );
    anchorGroup.setAttribute('id', `anchor-handle-${command.identifier}`);
    anchorGroup.setAttribute('tabindex', '0');
    anchorGroup.setAttribute('role', 'button');
    anchorGroup.setAttribute(
      'aria-label',
      state.currentLanguage === 'en'
        ? `Anchor node for command ${index + 1} of type ${command.type}`
        : `Point d'ancrage de la commande ${index + 1} de type ${command.type}`
    );

    const glowRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    glowRing.setAttribute('class', 'anchor-ring-glow');
    glowRing.setAttribute('cx', absoluteRecord.absoluteEnd.xCoordinate.toString());
    glowRing.setAttribute('cy', absoluteRecord.absoluteEnd.yCoordinate.toString());
    glowRing.setAttribute('r', '18');
    anchorGroup.appendChild(glowRing);

    const handleCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    handleCircle.setAttribute('class', 'anchor-circle');
    handleCircle.setAttribute('cx', absoluteRecord.absoluteEnd.xCoordinate.toString());
    handleCircle.setAttribute('cy', absoluteRecord.absoluteEnd.yCoordinate.toString());
    handleCircle.setAttribute('r', '7.5');
    anchorGroup.appendChild(handleCircle);

    const innerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerDot.setAttribute('class', 'anchor-inner-dot');
    innerDot.setAttribute('cx', absoluteRecord.absoluteEnd.xCoordinate.toString());
    innerDot.setAttribute('cy', absoluteRecord.absoluteEnd.yCoordinate.toString());
    innerDot.setAttribute('r', '3');
    anchorGroup.appendChild(innerDot);

    anchorGroup.addEventListener('pointerdown', (event: PointerEvent) =>
    {
      event.stopPropagation();
      setFocusedActiveCommand(command.identifier);
      initializeHandleDragSequence(event, anchorGroup, (newLogicalCoordinateX: number, newLogicalCoordinateY: number) =>
      {
        applyDragShiftToAnchor(command, previousAnchor, newLogicalCoordinateX, newLogicalCoordinateY);
      });
    });

    anchorGroup.addEventListener('keydown', (event: KeyboardEvent) =>
    {
      if (event.key === 'Enter' || event.key === ' ')
      {
        event.preventDefault();
        setFocusedActiveCommand(command.identifier);
        return;
      }

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key))
      {
        event.preventDefault();
        setFocusedActiveCommand(command.identifier);

        const
          currentX = absoluteRecord.absoluteEnd.xCoordinate,
          currentY = absoluteRecord.absoluteEnd.yCoordinate,
          step = event.shiftKey ? 10 : 1;

        let
          newX = currentX,
          newY = currentY;

        if (event.key === 'ArrowLeft')
          newX -= step;
        else if (event.key === 'ArrowRight')
          newX += step;
        else if (event.key === 'ArrowUp')
          newY -= step;
        else if (event.key === 'ArrowDown')
          newY += step;

        newX = Math.round(Math.max(0, Math.min(400, newX)));
        newY = Math.round(Math.max(0, Math.min(400, newY)));

        applyDragShiftToAnchor(command, previousAnchor, newX, newY);
        announceToScreenReader(state.currentLanguage === 'en' ? `Moved point to ${newX}, ${newY}` : `Point déplacé à ${newX}, ${newY}`);
      }
    });

    markersContainer.appendChild(anchorGroup);

    if (command.type === 'curve' && absoluteRecord.absoluteControlOne)
    {
      const
        startOfCurveAnchor = previousAnchor,
        lineOne = document.createElementNS('http://www.w3.org/2000/svg', 'line');

      lineOne.setAttribute('id', `line-one-${command.identifier}`);
      lineOne.setAttribute('class', 'svg-auxiliary-line');
      lineOne.setAttribute('x1', startOfCurveAnchor.xCoordinate.toString());
      lineOne.setAttribute('y1', startOfCurveAnchor.yCoordinate.toString());
      lineOne.setAttribute('x2', absoluteRecord.absoluteControlOne.xCoordinate.toString());
      lineOne.setAttribute('y2', absoluteRecord.absoluteControlOne.yCoordinate.toString());
      auxiliaryContainer.appendChild(lineOne);

      const controlOneGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      controlOneGroup.setAttribute('class', 'control-handle-g');
      controlOneGroup.setAttribute('id', `control-one-handle-${command.identifier}`);
      controlOneGroup.setAttribute('tabindex', '0');
      controlOneGroup.setAttribute('role', 'button');
      controlOneGroup.setAttribute(
        'aria-label',
        state.currentLanguage === 'en'
          ? `Primary Bézier control point for command ${index + 1}`
          : `Poignée de contrôle initiale de la courbe de Bézier de l'élément numéro ${index + 1}`
      );

      const controlOneGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      controlOneGlow.setAttribute('class', 'ctrl-circle-glow');
      controlOneGlow.setAttribute('cx', absoluteRecord.absoluteControlOne.xCoordinate.toString());
      controlOneGlow.setAttribute('cy', absoluteRecord.absoluteControlOne.yCoordinate.toString());
      controlOneGlow.setAttribute('r', '14');
      controlOneGroup.appendChild(controlOneGlow);

      const controlOneCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      controlOneCircle.setAttribute('class', 'control-point-outer');
      controlOneCircle.setAttribute('cx', absoluteRecord.absoluteControlOne.xCoordinate.toString());
      controlOneCircle.setAttribute('cy', absoluteRecord.absoluteControlOne.yCoordinate.toString());
      controlOneCircle.setAttribute('r', '5.5');
      controlOneGroup.appendChild(controlOneCircle);

      const controlOneInner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      controlOneInner.setAttribute('class', 'control-point-inner');
      controlOneInner.setAttribute('cx', absoluteRecord.absoluteControlOne.xCoordinate.toString());
      controlOneInner.setAttribute('cy', absoluteRecord.absoluteControlOne.yCoordinate.toString());
      controlOneInner.setAttribute('r', '2.5');
      controlOneGroup.appendChild(controlOneInner);

      controlOneGroup.addEventListener('pointerdown', (event: PointerEvent) =>
      {
        event.stopPropagation();
        controlOneGroup.classList.add('active-drag');
        setFocusedActiveCommand(command.identifier);

        initializeHandleDragSequence(event, controlOneGroup, (newLogicalCoordinateX: number, newLogicalCoordinateY: number) =>
        {
          applyDragShiftToControlPoint(command, 'first', startOfCurveAnchor, newLogicalCoordinateX, newLogicalCoordinateY);
        }, () =>
        {
          controlOneGroup.classList.remove('active-drag');
        });
      });

      controlOneGroup.addEventListener('keydown', (event: KeyboardEvent) =>
      {
        if (event.key === 'Enter' || event.key === ' ')
        {
          event.preventDefault();
          setFocusedActiveCommand(command.identifier);
          return;
        }

        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key))
        {
          event.preventDefault();
          setFocusedActiveCommand(command.identifier);

          const controlOne = absoluteRecord.absoluteControlOne;

          if (!controlOne)
            return;

          const
            currentX = controlOne.xCoordinate,
            currentY = controlOne.yCoordinate,
            step = event.shiftKey ? 10 : 1;

          let
            newX = currentX,
            newY = currentY;

          if (event.key === 'ArrowLeft')
            newX -= step;
          else if (event.key === 'ArrowRight')
            newX += step;
          else if (event.key === 'ArrowUp')
            newY -= step;
          else if (event.key === 'ArrowDown')
            newY += step;

          newX = Math.round(Math.max(0, Math.min(400, newX)));
          newY = Math.round(Math.max(0, Math.min(400, newY)));

          applyDragShiftToControlPoint(command, 'first', startOfCurveAnchor, newX, newY);
        }
      });

      markersContainer.appendChild(controlOneGroup);

      if (command.hasSecondControlCircle && absoluteRecord.absoluteControlTwo)
      {
        const lineTwo = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        lineTwo.setAttribute('id', `line-two-${command.identifier}`);
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
        controlTwoGroup.setAttribute(
          'aria-label',
          state.currentLanguage === 'en'
            ? `Secondary Bézier control point for command ${index + 1}`
            : `Poignée de contrôle secondaire de la courbe de Bézier de l'élément numéro ${index + 1}`
        );

        const controlTwoGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        controlTwoGlow.setAttribute('class', 'ctrl-circle-glow');
        controlTwoGlow.setAttribute('cx', absoluteRecord.absoluteControlTwo.xCoordinate.toString());
        controlTwoGlow.setAttribute('cy', absoluteRecord.absoluteControlTwo.yCoordinate.toString());
        controlTwoGlow.setAttribute('r', '14');
        controlTwoGroup.appendChild(controlTwoGlow);

        const controlTwoCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        controlTwoCircle.setAttribute('class', 'control-point-outer');
        controlTwoCircle.setAttribute('cx', absoluteRecord.absoluteControlTwo.xCoordinate.toString());
        controlTwoCircle.setAttribute('cy', absoluteRecord.absoluteControlTwo.yCoordinate.toString());
        controlTwoCircle.setAttribute('r', '5.5');
        controlTwoGroup.appendChild(controlTwoCircle);

        const controlTwoInner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        controlTwoInner.setAttribute('class', 'control-point-inner');
        controlTwoInner.setAttribute('cx', absoluteRecord.absoluteControlTwo.xCoordinate.toString());
        controlTwoInner.setAttribute('cy', absoluteRecord.absoluteControlTwo.yCoordinate.toString());
        controlTwoInner.setAttribute('r', '2.5');
        controlTwoGroup.appendChild(controlTwoInner);

        controlTwoGroup.addEventListener('pointerdown', (event: PointerEvent) =>
        {
          event.stopPropagation();
          controlTwoGroup.classList.add('active-drag');
          setFocusedActiveCommand(command.identifier);

          initializeHandleDragSequence(event, controlTwoGroup, (newLogicalCoordinateX: number, newLogicalCoordinateY: number) =>
          {
            applyDragShiftToControlPoint(command, 'second', startOfCurveAnchor, newLogicalCoordinateX, newLogicalCoordinateY);
          }, () =>
          {
            controlTwoGroup.classList.remove('active-drag');
          });
        });

        controlTwoGroup.addEventListener('keydown', (event: KeyboardEvent) =>
        {
          if (event.key === 'Enter' || event.key === ' ')
          {
            event.preventDefault();
            setFocusedActiveCommand(command.identifier);
            return;
          }

          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key))
          {
            event.preventDefault();
            setFocusedActiveCommand(command.identifier);

            const controlTwo = absoluteRecord.absoluteControlTwo;

            if (!controlTwo)
              return;

            const
              currentX = controlTwo.xCoordinate,
              currentY = controlTwo.yCoordinate,
              step = event.shiftKey ? 10 : 1;

            let
              newX = currentX,
              newY = currentY;

            if (event.key === 'ArrowLeft')
              newX -= step;
            else if (event.key === 'ArrowRight')
              newX += step;
            else if (event.key === 'ArrowUp')
              newY -= step;
            else if (event.key === 'ArrowDown')
              newY += step;

            newX = Math.round(Math.max(0, Math.min(400, newX)));
            newY = Math.round(Math.max(0, Math.min(400, newY)));

            applyDragShiftToControlPoint(command, 'second', startOfCurveAnchor, newX, newY);
          }
        });

        markersContainer.appendChild(controlTwoGroup);
      }
    }
  }

  if (activeElementId)
  {
    const elementToFocus = document.getElementById(activeElementId);

    if (elementToFocus)
      elementToFocus.focus();
  }
}

/**
 * Handles mouse / touch dragging interactions tracking captured pointer relative positions
 */
export function initializeHandleDragSequence(
  startPointerEvent: PointerEvent,
  captureTargetGroup: SVGElement,
  onMoveUpdateCallback: (logicalCoordinateX: number, logicalCoordinateY: number) => void,
  onDragEndCallback?: () => void
): void
{
  const paintboard = document.getElementById('paintboard');

  if (!paintboard)
    return;

  try
  {
    captureTargetGroup.setPointerCapture(startPointerEvent.pointerId);
  } catch (exception)
  {
    // Ignore if not supported or not allowed in specific containment
  }

  const pointerMoveHandler = (moveEvent: PointerEvent) =>
  {
    state.isCurrentlyDragging = true;

    const logicalCoordinates = computeLogicalCoordinates(
      moveEvent.clientX,
      moveEvent.clientY,
      paintboard,
      true
    );

    onMoveUpdateCallback(logicalCoordinates.xCoordinate, logicalCoordinates.yCoordinate);
  };

  const pointerUpHandler = (releaseEvent: PointerEvent) =>
  {
    state.isCurrentlyDragging = false;

    try
    {
      captureTargetGroup.releasePointerCapture(releaseEvent.pointerId);
    } catch (exception)
    {
      // Ignore
    }

    window.removeEventListener('pointermove', pointerMoveHandler);
    window.removeEventListener('pointerup', pointerUpHandler);
    window.removeEventListener('pointercancel', pointerUpHandler);

    if (onDragEndCallback)
      onDragEndCallback();

    updateVisualClippedLayoutAndCanvas();
  };

  window.addEventListener('pointermove', pointerMoveHandler);
  window.addEventListener('pointerup', pointerUpHandler);
  window.addEventListener('pointercancel', pointerUpHandler);
}

export function applyDragShiftToAnchor(
  command: ShapeCommand,
  previousAnchor: Coordinate,
  logicalCoordinateX: number,
  logicalCoordinateY: number
): void
{
  const
    hasToModifier = 'syntaxModifier' in command && command.syntaxModifier === 'to',
    horizontalOffsetReference = (command.type === 'from' || hasToModifier)
      ? 0
      : previousAnchor.xCoordinate,
    verticalOffsetReference = (command.type === 'from' || hasToModifier)
      ? 0
      : previousAnchor.yCoordinate,
    targetLogicalCoordinateX = logicalCoordinateX - horizontalOffsetReference,
    targetLogicalCoordinateY = logicalCoordinateY - verticalOffsetReference;

  if ('xCoordinate' in command && 'yCoordinate' in command)
  {
    command.xCoordinate = convertPixelsToUnit(targetLogicalCoordinateX, command.horizontalUnit);
    command.yCoordinate = convertPixelsToUnit(targetLogicalCoordinateY, command.verticalUnit);

    stablePushCoordinateValueToSidebarInputs(command.identifier, 'xCoordinate', command.xCoordinate);
    stablePushCoordinateValueToSidebarInputs(command.identifier, 'yCoordinate', command.yCoordinate);
  } else if (command.type === 'hline')
  {
    command.value = convertPixelsToUnit(targetLogicalCoordinateX, command.unit);
    stablePushCoordinateValueToSidebarInputs(command.identifier, 'value', command.value);
  } else if (command.type === 'vline')
  {
    command.value = convertPixelsToUnit(targetLogicalCoordinateY, command.unit);
    stablePushCoordinateValueToSidebarInputs(command.identifier, 'value', command.value);
  }

  updateVisualClippedLayoutAndCanvas();
}

export function applyDragShiftToControlPoint(
  command: CurveCommand,
  controlPointSelection: 'first' | 'second',
  curveStartingAnchor: Coordinate,
  logicalCoordinateX: number,
  logicalCoordinateY: number
): void
{
  const
    relativeOffsetReferenceX = command.syntaxModifier === 'to'
      ? 0
      : curveStartingAnchor.xCoordinate,
    relativeOffsetReferenceY = command.syntaxModifier === 'to'
      ? 0
      : curveStartingAnchor.yCoordinate,
    targetLogicalCoordinateX = logicalCoordinateX - relativeOffsetReferenceX,
    targetLogicalCoordinateY = logicalCoordinateY - relativeOffsetReferenceY;

  if (controlPointSelection === 'first')
  {
    command.firstControlCircle.xCoordinate = convertPixelsToUnit(targetLogicalCoordinateX, command.firstControlHorizontalUnit);
    command.firstControlCircle.yCoordinate = convertPixelsToUnit(targetLogicalCoordinateY, command.firstControlVerticalUnit);

    stablePushCoordinateValueToSidebarInputs(command.identifier, 'firstControlCircle-xCoordinate', command.firstControlCircle.xCoordinate);
    stablePushCoordinateValueToSidebarInputs(command.identifier, 'firstControlCircle-yCoordinate', command.firstControlCircle.yCoordinate);
  } else
  {
    command.secondControlCircle.xCoordinate = convertPixelsToUnit(targetLogicalCoordinateX, command.secondControlHorizontalUnit);
    command.secondControlCircle.yCoordinate = convertPixelsToUnit(targetLogicalCoordinateY, command.secondControlVerticalUnit);

    stablePushCoordinateValueToSidebarInputs(command.identifier, 'secondControlCircle-xCoordinate', command.secondControlCircle.xCoordinate);
    stablePushCoordinateValueToSidebarInputs(command.identifier, 'secondControlCircle-yCoordinate', command.secondControlCircle.yCoordinate);
  }

  updateVisualClippedLayoutAndCanvas();
}

/**
 * Double-clicking on the Canvas places a new node exactly where requested.
 */
export function handleCanvasDoubleClick(logicalCoordinateX: number, logicalCoordinateY: number): void
{
  const
    newIdentifier = `cmd-dbl-${Date.now()}`,
    roundedCoordinateX = Math.round(logicalCoordinateX),
    roundedCoordinateY = Math.round(logicalCoordinateY);

  toggleCollapsibleSection('commandsCard', 'expand');

  const command: ShapeCommand = {
    identifier: newIdentifier,
    type: 'line',
    syntaxModifier: 'to',
    xCoordinate: roundedCoordinateX,
    yCoordinate: roundedCoordinateY,
    horizontalUnit: 'px',
    verticalUnit: 'px'
  };

  let insertIndex = -1;

  if (state.selectedCommandIdentifier)
    insertIndex = state.commandsStack.findIndex((commandItem: ShapeCommand) => commandItem.identifier === state.selectedCommandIdentifier);

  if (insertIndex !== -1)
  {
    const selectedCommand = state.commandsStack[insertIndex];

    if (selectedCommand.type === 'close')
      state.commandsStack.splice(insertIndex, 0, command);
    else
      state.commandsStack.splice(insertIndex + 1, 0, command);
  } else
  {
    if (state.commandsStack.length > 1 && state.commandsStack[state.commandsStack.length - 1].type === 'close')
      state.commandsStack.splice(state.commandsStack.length - 1, 0, command);
    else
      state.commandsStack.push(command);
  }

  setFocusedActiveCommand(newIdentifier);
  stableRebuildCommandsSidebarDOM();
  updateVisualClippedLayoutAndCanvas();
  announceToScreenReader(state.currentLanguage === 'en'
    ? `Added point on canvas at X: ${roundedCoordinateX}, Y: ${roundedCoordinateY}`
    : `Point ajouté sur le canevas à l'emplacement X: ${roundedCoordinateX}, Y: ${roundedCoordinateY}`
  );
}