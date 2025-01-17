/*
 * Copyright 2021 Google LLC
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
import { __, _x } from '@web-stories-wp/i18n';

export default {
  slug: 'plant-based-dyes',
  creationDate: '2021-07-12T00:00:00.000Z',
  title: _x('Plant Based Dyes DIY', 'template name', 'web-stories'),
  tags: [
    _x('Crafts', 'template keyword', 'web-stories'),
    _x('Plant', 'template keyword', 'web-stories'),
    _x('DIY', 'template keyword', 'web-stories'),
    _x('Calm', 'template keyword', 'web-stories'),
    _x('Green', 'template keyword', 'web-stories'),
  ],
  colors: [
    {
      label: _x('Sweet Corn Yellow', 'color', 'web-stories'),
      color: '#f9e46c',
    },
    { label: _x('Rainforest Green', 'color', 'web-stories'), color: '#4a6747' },
    { label: _x('Herbal Green', 'color', 'web-stories'), color: '#a7aa2d' },
    { label: _x('Dark Leaf Green', 'color', 'web-stories'), color: '#414c40' },
    { label: _x('Almond Milk', 'color', 'web-stories'), color: '#f3e9d4' },
  ],
  description: __(
    'With its gentle shapes, modest font and soothing pastel tones, this template will let you create nature-inspired DIY guides that feel relaxed and serene.',
    'web-stories'
  ),
  vertical: _x('Arts & Crafts', 'template vertical', 'web-stories'),
};
