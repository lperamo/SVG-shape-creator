/**
 * @license
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ShapeCommand } from './types.js';
import { state } from './state.js';

/**
 * Builds the pure CSS shape() string from the local command structures.
 * Formats standard coordinates beautifully.
 */
export function compileShapeCodeString(commands: ShapeCommand[]): string
{
  if (commands.length === 0)
    return 'clip-path: none;';

  const outputLines: string[] = [];

  for (let index = 0; index < commands.length; index = index + 1)
  {
    const currentCommand = commands[index];
    let statementLine = '';

    switch (currentCommand.type)
    {
      case 'from':
      {
        const
          xCoordinateValue = currentCommand.xCoordinate,
          yCoordinateValue = currentCommand.yCoordinate;

        statementLine = `from ${xCoordinateValue}${currentCommand.horizontalUnit} ${yCoordinateValue}${currentCommand.verticalUnit}`;
        break;
      }

      case 'line':
      {
        const
          xCoordinateValue = currentCommand.xCoordinate,
          yCoordinateValue = currentCommand.yCoordinate;

        statementLine = `line ${currentCommand.syntaxModifier} ${xCoordinateValue}${currentCommand.horizontalUnit} ${yCoordinateValue}${currentCommand.verticalUnit}`;
        break;
      }

      case 'hline':
      {
        statementLine = `hline ${currentCommand.syntaxModifier} ${currentCommand.value}${currentCommand.unit}`;
        break;
      }

      case 'vline':
      {
        statementLine = `vline ${currentCommand.syntaxModifier} ${currentCommand.value}${currentCommand.unit}`;
        break;
      }

      case 'curve':
      {
        const
          targetXCoordinate = currentCommand.xCoordinate,
          targetYCoordinate = currentCommand.yCoordinate,
          controlOneXCoordinate = currentCommand.firstControlCircle.xCoordinate,
          controlOneYCoordinate = currentCommand.firstControlCircle.yCoordinate;

        let curveExpression = `curve ${currentCommand.syntaxModifier} ${targetXCoordinate}${currentCommand.horizontalUnit} ${targetYCoordinate}${currentCommand.verticalUnit} with ${controlOneXCoordinate}${currentCommand.firstControlHorizontalUnit} ${controlOneYCoordinate}${currentCommand.firstControlVerticalUnit}`;

        if (currentCommand.hasSecondControlCircle)
        {
          const
            controlTwoXCoordinate = currentCommand.secondControlCircle.xCoordinate,
            controlTwoYCoordinate = currentCommand.secondControlCircle.yCoordinate;

          curveExpression = `${curveExpression} / ${controlTwoXCoordinate}${currentCommand.secondControlHorizontalUnit} ${controlTwoYCoordinate}${currentCommand.secondControlVerticalUnit}`;
        }

        statementLine = curveExpression;
        break;
      }

      case 'arc':
      {
        const
          targetXCoordinate = currentCommand.xCoordinate,
          targetYCoordinate = currentCommand.yCoordinate,
          radiusXCoordinate = currentCommand.radiusX,
          radiusYCoordinate = currentCommand.radiusY;

        statementLine = `arc ${currentCommand.syntaxModifier} ${targetXCoordinate}${currentCommand.horizontalUnit} ${targetYCoordinate}${currentCommand.verticalUnit} of ${radiusXCoordinate}${currentCommand.radiusXUnit} ${radiusYCoordinate}${currentCommand.radiusYUnit} ${currentCommand.arcSize} ${currentCommand.sweepDirection}`;

        if (currentCommand.rotationAngle !== 0)
          statementLine = `${statementLine} rotate ${currentCommand.rotationAngle}deg`;

        break;
      }

      case 'close':
      {
        statementLine = 'close';
        break;
      }
    }

    if (statementLine)
      outputLines.push(`  ${statementLine}`);
  }

  return `clip-path: shape(\n${outputLines.join(',\n')}\n);`;
}

/**
 * Compiles the CSS Animation or Transition code blocks when State A and State B are defined.
 */
export function compileCSSAnimationCodeString(): string
{
  if (!state.initialStateCommands || !state.finalStateCommands)
  {
    if (state.currentLanguage === 'fr')
    {
      return '/*\n' +
        '  Étape 1 : Enregistrez une forme initiale comme "État A" dans le module d\'animation.\n' +
        '  Étape 2 : Modifiez la forme sur la grille, puis enregistrez-la comme "État B".\n\n' +
        '  Une fois les deux états définis, le code de transition et de keyframes CSS\n' +
        '  sera disponible ici en temps réel !\n' +
        '*/';
    } else
    {
      return '/*\n' +
        '  Step 1: Save an initial shape as \'State A\' in the Animation Module.\n' +
        '  Step 2: Modify the shape on the grid, then save it as \'State B\'.\n\n' +
        '  Once both states are defined, the CSS Transition & Keyframes Code\n' +
        '  will be available here in real-time!\n' +
        '*/';
    }
  }

  const
    durationSlider = document.getElementById('animationDurationRange') as HTMLInputElement | null,
    durationInSeconds = durationSlider ? durationSlider.value : '1.2',
    initialStateCompiledCode = compileShapeCodeString(state.initialStateCommands),
    finalStateCompiledCode = compileShapeCodeString(state.finalStateCommands);

  return '/* Approach 1: Smooth CSS Transition on hover */\n' +
    '.clipped-element {\n' +
    '  width: 400px;\n' +
    '  height: 400px;\n' +
    '  background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-cyan-accent) 100%);\n' +
    '  ' + initialStateCompiledCode.replace(/\n/g, '\n  ') + '\n' +
    '  transition: clip-path ' + durationInSeconds + 's cubic-bezier(.4, 0, .2, 1);\n' +
    '}\n\n' +
    '.clipped-element:hover {\n' +
    '  ' + finalStateCompiledCode.replace(/\n/g, '\n  ') + '\n' +
    '}\n\n' +
    '/* Approach 2: Continuous keyframe loop animation */\n' +
    '@keyframes shape-fluid-transition {\n' +
    '  0% {\n' +
    '    ' + initialStateCompiledCode.replace(/\n/g, '\n    ') + '\n' +
    '  }\n' +
    '  100% {\n' +
    '    ' + finalStateCompiledCode.replace(/\n/g, '\n    ') + '\n' +
    '  }\n' +
    '}\n\n' +
    '.clipped-element-animated {\n' +
    '  width: 400px;\n' +
    '  height: 400px;\n' +
    '  background: linear-gradient(135deg, var(--color-brand-primary) 0%, var(--color-cyan-accent) 100%);\n' +
    '  animation: shape-fluid-transition ' + durationInSeconds + 's infinite alternate cubic-bezier(.4, 0, .2, 1);\n' +
    '}';
}