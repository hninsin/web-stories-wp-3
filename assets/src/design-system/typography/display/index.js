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
import styled from 'styled-components';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { THEME_CONSTANTS } from '../../theme';
import { defaultTypographyStyle } from '../styles';

export const Display = styled.h1`
  ${defaultTypographyStyle}
  ${({ size, theme }) => {
    const { display } = theme.typography.presets;
    return {
      fontSize: `${display[size].size}px`,
      fontWeight: display[size].weight,
      lineHeight: `${display[size].lineHeight}px`,
      letterSpacing: `${display[size].letterSpacing}px`,
    };
  }}
`;

Display.propTypes = {
  as: PropTypes.oneOf(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).isRequired,
  size: PropTypes.oneOf(THEME_CONSTANTS.DISPLAY_SIZES),
};
Display.defaultProps = {
  size: THEME_CONSTANTS.TYPOGRAPHY_PRESET_SIZES.MEDIUM,
};
