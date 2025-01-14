/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import { useCallback } from '@web-stories-wp/react';
import styled, { css } from 'styled-components';
import { __ } from '@web-stories-wp/i18n';
import {
  LockToggle,
  NumericInput,
  Icons,
  themeHelpers,
} from '@web-stories-wp/design-system';

/**
 * Internal dependencies
 */
import { canMaskHaveBorder } from '../../../../masks';
import Tooltip from '../../../tooltip';
import { useCommonObjectValue, focusStyle } from '../../shared';
import { MULTIPLE_DISPLAY_VALUE, MULTIPLE_VALUE } from '../../../../constants';

const DEFAULT_BORDER_RADIUS = {
  topLeft: 0,
  topRight: 0,
  bottomRight: 0,
  bottomLeft: 0,
  locked: true,
};

const FlexContainer = styled.div`
  display: flex;
`;

const InputContainer = styled.div`
  margin-left: 1px;
  ${({ isSmall }) => (!isSmall ? 'max-width: 106px' : '')}
`;

const LockContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 32px;
  margin-left: 8px;
`;

const StyledLockToggle = styled(LockToggle)`
  ${focusStyle};
`;

const inputContainerStyleOverride = css`
  position: relative;
  :focus-within {
    z-index: 1;
    ${({ theme }) =>
      themeHelpers.focusCSS(
        theme.colors.border.focus,
        theme.colors.bg.secondary
      )};
  }
`;

const styleOverrideTopLeft = css`
  ${inputContainerStyleOverride}
  border-radius: 4px 0 0 4px;
`;

const styleOverrideTopRight = css`
  ${inputContainerStyleOverride}
  border-radius: 0;
`;

const styleOverrideBottomLeft = css`
  ${inputContainerStyleOverride}
  border-radius: 0;
`;

const styleOverrideBottomRight = css`
  ${inputContainerStyleOverride}
  border-radius: 0 4px 4px 0;
`;

const BoxedNumericInput = styled(NumericInput)`
  border-radius: 0px;
  margin-left: -1px;
  svg {
    ${({ corner }) => (corner === 'topLeft' ? 'transform: rotate(90deg);' : '')}
  }

  ${({ isSmall, corner }) =>
    isSmall &&
    `
    width: 25%;
    svg {
      ${corner === 'topRight' ? 'transform: rotate(180deg);' : ''}
      ${corner === 'bottomRight' ? 'transform: rotate(270deg);' : ''}
      width: 29px;
      height: 29px;
      margin-right: -14px;
    }
  `}
`;

function RadiusControls({ selectedElements, pushUpdateForObject }) {
  const borderRadius = useCommonObjectValue(
    selectedElements,
    'borderRadius',
    DEFAULT_BORDER_RADIUS
  );

  const allSupportBorder = selectedElements.every((el) =>
    canMaskHaveBorder(el)
  );

  const lockRadius = borderRadius.locked === true;

  const handleChange = useCallback(
    (name, value) => {
      const newRadius = !lockRadius
        ? {
            [name]: value,
          }
        : {
            topLeft: value,
            topRight: value,
            bottomRight: value,
            bottomLeft: value,
          };
      pushUpdateForObject(
        'borderRadius',
        newRadius,
        DEFAULT_BORDER_RADIUS,
        true
      );
    },
    [pushUpdateForObject, lockRadius]
  );

  const handleLockChange = useCallback(
    (locked) => {
      const newRadius = locked
        ? {
            locked,
            topLeft: borderRadius.topLeft,
            topRight: borderRadius.topLeft,
            bottomRight: borderRadius.topLeft,
            bottomLeft: borderRadius.topLeft,
          }
        : {
            locked,
          };
      pushUpdateForObject(
        'borderRadius',
        newRadius,
        DEFAULT_BORDER_RADIUS,
        true
      );
    },
    [pushUpdateForObject, borderRadius]
  );

  if (!allSupportBorder) {
    return null;
  }

  const firstInputLabel = lockRadius
    ? __('Corner Radius', 'web-stories')
    : __('Top left corner radius', 'web-stories');
  return (
    <FlexContainer>
      <InputContainer isSmall={!lockRadius}>
        <BoxedNumericInput
          isSmall={!lockRadius}
          corner="topLeft"
          suffix={<Icons.Corner />}
          value={
            borderRadius.topLeft === MULTIPLE_VALUE ? '' : borderRadius.topLeft
          }
          aria-label={firstInputLabel}
          onChange={(_, value) => handleChange('topLeft', value)}
          placeholder={
            borderRadius.topLeft === MULTIPLE_VALUE
              ? MULTIPLE_DISPLAY_VALUE
              : ''
          }
          isIndeterminate={borderRadius.topLeft === MULTIPLE_VALUE}
          containerStyleOverride={
            lockRadius ? inputContainerStyleOverride : styleOverrideTopLeft
          }
        />
        {!lockRadius && (
          <>
            <BoxedNumericInput
              isSmall
              corner="topRight"
              suffix={<Icons.Corner />}
              value={
                borderRadius.topRight === MULTIPLE_VALUE
                  ? ''
                  : borderRadius.topRight
              }
              aria-label={__('Top right corner radius', 'web-stories')}
              onChange={(_, value) => handleChange('topRight', value)}
              placeholder={
                borderRadius.topRight === MULTIPLE_VALUE
                  ? MULTIPLE_DISPLAY_VALUE
                  : ''
              }
              isIndeterminate={borderRadius.topRight === MULTIPLE_VALUE}
              containerStyleOverride={styleOverrideTopRight}
            />
            <BoxedNumericInput
              isSmall
              value={
                borderRadius.bottomLeft === MULTIPLE_VALUE
                  ? ''
                  : borderRadius.bottomLeft
              }
              aria-label={__('Bottom left corner radius', 'web-stories')}
              onChange={(_, value) => handleChange('bottomLeft', value)}
              placeholder={
                borderRadius.bottomLeft === MULTIPLE_VALUE
                  ? MULTIPLE_DISPLAY_VALUE
                  : ''
              }
              suffix={<Icons.Corner />}
              isIndeterminate={borderRadius.bottomLeft === MULTIPLE_VALUE}
              containerStyleOverride={styleOverrideBottomLeft}
            />
            <BoxedNumericInput
              isSmall
              value={
                borderRadius.bottomRight === MULTIPLE_VALUE
                  ? ''
                  : borderRadius.bottomRight
              }
              aria-label={__('Bottom right corner radius', 'web-stories')}
              onChange={(_, value) => handleChange('bottomRight', value)}
              placeholder={
                borderRadius.bottomRight === MULTIPLE_VALUE
                  ? MULTIPLE_DISPLAY_VALUE
                  : ''
              }
              corner="bottomRight"
              suffix={<Icons.Corner />}
              isIndeterminate={borderRadius.bottomRight === MULTIPLE_VALUE}
              containerStyleOverride={styleOverrideBottomRight}
            />
          </>
        )}
      </InputContainer>
      <LockContainer>
        <Tooltip title={__('Toggle consistent corner radius', 'web-stories')}>
          <StyledLockToggle
            isLocked={borderRadius.locked}
            onClick={() => handleLockChange(!borderRadius.locked)}
            aria-label={__('Toggle consistent corner radius', 'web-stories')}
          />
        </Tooltip>
      </LockContainer>
    </FlexContainer>
  );
}

RadiusControls.propTypes = {
  selectedElements: PropTypes.array.isRequired,
  pushUpdateForObject: PropTypes.func.isRequired,
};

export default RadiusControls;
