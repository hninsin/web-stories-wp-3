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
import {
  PAGE_RATIO,
  FULLBLEED_RATIO,
  dataToFontSizeY,
  dataFontEm,
  getBox,
  getBoundRect,
} from '@web-stories-wp/units';
import { getMediaSizePositionProps } from '@web-stories-wp/media';

/**
 * Internal dependencies
 */
import {
  setOrCreateImage,
  getImgNodeId,
} from '../../../../utils/getMediaBaseColor';
import {
  calculateLuminanceFromRGB,
  calculateLuminanceFromStyleColor,
  checkContrastFromLuminances,
} from '../../../../utils/contrastUtils';
import { getSpansFromContent } from '../../utils';

/**
 * @typedef {import('../../../../types').Page} Page
 * @typedef {import('../../../../types').Element} Element
 * @typedef RGB The shape of color objects used for calculating color use against accessibility standards
 * @property {number} r red value
 * @property {number} g green value
 * @property {number} b blue value
 */

/**
 *
 * @param {number} fontSize The text element's font size in editor pixels
 * @return {number} the true font size for measuring against accessibility standards
 */
function getPtFromEditorFontSize(fontSize) {
  // 1 point = 1.333333 px
  return dataFontEm(dataToFontSizeY(fontSize, 100)) * 1.333333;
}

/**
 *
 * @param {Element} a An element with a position and size
 * @param {Element} b An element with a position and size
 * @return {number} The total area of the elements' overlapping rectangles
 */
function getOverlappingArea(a, b) {
  const dx = Math.min(a.endX, b.endX) - Math.max(a.startX, b.startX);
  const dy = Math.min(a.endY, b.endY) - Math.max(a.startY, b.startY);
  if (dx >= 0 && dy >= 0) {
    return dx * dy;
  }
  return 0;
}

const OVERLAP_RATIO = 1 / 3;
/**
 *
 * @param {number} overlapArea The amount of area that the text element overlaps with the element
 * @param {number} textBoxArea The amount of area of the text element
 * @return {boolean} True if the amount of overlap is visually significant
 */
function isOverlapSignificant(overlapArea, textBoxArea) {
  return overlapArea >= OVERLAP_RATIO * textBoxArea;
}

/**
 * Returns the provided background elements filtered for elements which overlap significantly
 * with the text element and are not occluded by the other elements
 *
 * @param {Element} textElement The text element which is in front of the potential background elements
 * @param {Element[]} potentialBackgroundElements All the elements behind the text element
 * @param {Page} page The page with all the elements
 * @return {Element[]} The visually significant background elements
 */
function getBackgroundsForElement(
  textElement,
  potentialBackgroundElements,
  page
) {
  const { pageSize } = page;
  const textPos = getBox(textElement, pageSize?.width, pageSize?.height);
  const textBox = getBoundRect([textPos]);
  const textBoxArea = textBox.width * textBox.height;

  const elementOverlaps = [...potentialBackgroundElements]
    .map((element, index) => {
      const bgPos = getBox(element, pageSize?.width, pageSize?.height);
      const bgBox = getBoundRect([bgPos]);
      const overlappingArea = getOverlappingArea(textBox, bgBox);
      return {
        element:
          // if the element is the background element use the page's background color
          // image backgrounds will ignore this property
          element.isBackground || element.isDefaultBackground
            ? { ...element, backgroundColor: page?.backgroundColor }
            : element,
        area: overlappingArea,
        index,
      };
    })
    // elements are ordered from lowest to highest
    // so the first elements in the reversed array are occluding the text box area behind it;
    .reverse();

  let unoccludedArea = textBoxArea;
  const significantElements = [];
  for (const overlap of elementOverlaps) {
    if (!isOverlapSignificant(unoccludedArea, textBoxArea)) {
      break;
    }
    if (isOverlapSignificant(overlap.area, textBoxArea)) {
      significantElements.push(overlap.element);
    }
    unoccludedArea -= overlap.area;
  }
  return significantElements;
}

/**
 * @param {Object} arguments The arguments
 * @param {Element} arguments.background The image-type background element
 * @param {Element} arguments.text The text-type element
 * @param {Page} arguments.page The page with both elements
 * @return {Promise<RGB>} Resolves to the dominant color of the section of the image behind the text element
 */
function getTextImageBackgroundColor({ background, text, page }) {
  const { pageSize, id: pageId } = page;
  const { id: elementId } = text;
  const safeZoneDiff =
    (pageSize?.width / FULLBLEED_RATIO - pageSize?.width / PAGE_RATIO) / 2;

  const textPos = getBox(text, pageSize?.width, pageSize?.height);
  const textBox = getBoundRect([textPos]);

  const { resource, scale, focalX, focalY } = background;
  const bgBox = getBox(background, pageSize?.width, pageSize?.height);
  const { width, height } = bgBox;

  const bgMediaBox = getMediaSizePositionProps(
    resource,
    width,
    height,
    scale,
    focalX,
    focalY
  );

  const bgImage = {
    offsetX: bgMediaBox.offsetX,
    offsetY: bgMediaBox.offsetY,
    src: background.resource.src,
    width: bgMediaBox.width,
    height: bgMediaBox.height,
    rotationAngle: background.isBackground
      ? undefined
      : background.rotationAngle,
    flip: background.flip,
  };

  const overlapBox = {
    x: background.isBackground
      ? bgMediaBox.offsetX + Math.abs(textBox.startX)
      : bgMediaBox.offsetX + Math.abs(textBox.startX) - bgBox.x,
    y: background.isBackground
      ? bgMediaBox.offsetY + Math.abs(textBox.startY + safeZoneDiff)
      : bgMediaBox.offsetY +
        Math.abs(textBox.startY + safeZoneDiff) -
        (bgBox.y + safeZoneDiff),
    width: textBox.width,
    height: textBox.height,
  };

  return getOverlapBgColor({
    elementId,
    pageId,
    bgImage,
    bgBox,
    overlapBox,
  })
    .catch(() => {
      // ignore errors
    })
    .finally(() => {
      cleanupDOM({ pageId, elementId });
    });
}

const TO_RADIANS = Math.PI / 180;
/**
 * @param {Object} arguments The arguments
 * @param {string} arguments.elementId The unique ID of the element being checked for contrast
 * @param {string} arguments.pageId The unique ID of the page with elements being checked for contrast
 * @param {Element} arguments.bgImage The background element
 * @param {{ width: number, height: number }} arguments.bgBox The containing box of the background image - needed for calculating canvas translations for rotated elements
 * @param {{ x: number, y: number, width: number, height: number }} arguments.overlapBox The position and size of the text element relative to the scaled and roated background image
 * @return {Promise<RGB>} Resolves to the dominant color of the background image in the overlap box area
 */
function getOverlapBgColor({ elementId, pageId, bgImage, bgBox, overlapBox }) {
  function getOnloadCallback(nodeKey, resolve, reject) {
    return () => {
      try {
        const node = document.body[nodeKey];
        const canvas = document.createElement('canvas');

        canvas.width = bgImage.width;
        canvas.height = bgImage.height;

        const ctx = canvas.getContext('2d');

        if (bgImage.rotationAngle) {
          const translationOffsetX = bgImage.offsetX + bgBox.width / 2;
          const translationOffsetY = bgImage.offsetY + bgBox.height / 2;
          ctx.translate(translationOffsetX, translationOffsetY);
          ctx.rotate(bgImage.rotationAngle * TO_RADIANS);
          ctx.translate(-translationOffsetX, -translationOffsetY);
        }

        let xPos = 0,
          yPos = 0;

        const { flip } = bgImage;
        if (flip.vertical || flip.horizontal) {
          xPos = flip.horizontal ? bgImage.width * -1 : 0;
          yPos = flip.vertical ? bgImage.height * -1 : 0;
          ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
        }

        ctx.drawImage(
          node.firstElementChild,
          xPos,
          yPos,
          bgImage.width,
          bgImage.height
        );

        const imageData = ctx.getImageData(
          overlapBox.x,
          overlapBox.y,
          overlapBox.width,
          overlapBox.height
        );

        resolve(imageData);
      } catch (e) {
        reject(e);
      }
    };
  }
  return setOrCreateImage(
    { src: bgImage.src, id: pageId },
    getOnloadCallback
  ).then((imgData) => {
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = overlapBox.width; // size of the new image / text container
    cropCanvas.height = overlapBox.height;
    const cropCtx = cropCanvas.getContext('2d');
    const cropImage = new Image();
    cropImage.crossOrigin = 'anonymous';
    cropCtx.putImageData(imgData, 0, 0);
    cropImage.src = cropCanvas.toDataURL();
    return setOrCreateImage({
      src: cropImage.src,
      id: elementId,
    }).then(([r, g, b]) => ({ r, g, b }));
  });
}

/**
 *
 * @param {Element} element The text element to get font colors from
 * @return {Array} the style colors from the span tags in text element content
 */
function getTextStyleColors(element) {
  const spans = getSpansFromContent(element.content);
  const textStyleColors = spans
    .map((span) => span.style?.color)
    .filter(Boolean);
  // if no colors were retrieved but there are spans, there is a black default color
  const noColorStyleOnSpans =
    textStyleColors.length === 0 && spans.length !== 0;
  // if no spans were retrieved but there is content, there is a black default color
  const noSpans = element.content.length !== 0 && spans.length === 0;
  if (noColorStyleOnSpans || noSpans) {
    textStyleColors.push('rgb(0, 0, 0)');
  }
  return textStyleColors;
}

function getTextShapeBackgroundColor({ background }) {
  return background?.backgroundColor?.color;
}

/**
 * Returns guidance if the contrast between any of the text style colors and the background color is too low
 *
 * @param {Object} arguments The arguments
 * @param {RGB} arguments.backgroundColor The r, g, b object representing a background color to compare to the text colors
 * @param {Array} arguments.textStyleColors The array of style colors of the text being checked
 * @param {number} arguments.fontSize The font size (in editor pixels) of the text being checked
 * @return {boolean} If true, there is a contrast issue with some text
 */
function textBackgroundHasLowContrast({
  backgroundColor,
  textStyleColors,
  fontSize,
} = {}) {
  const noColorsToCompare = !textStyleColors || !backgroundColor;
  if (noColorsToCompare) {
    return false;
  }

  return textStyleColors.some((styleColor) => {
    if (!styleColor) {
      return false;
    }
    const textLuminance = calculateLuminanceFromStyleColor(styleColor);
    const backgroundLuminance = calculateLuminanceFromRGB(backgroundColor);
    const contrastCheck = checkContrastFromLuminances(
      textLuminance,
      backgroundLuminance,
      fontSize && getPtFromEditorFontSize(fontSize)
    );
    return !contrastCheck.WCAG_AA;
  });
}

function getBackgroundColorByType(element) {
  switch (element.type) {
    case 'image':
      return getTextImageBackgroundColor;
    case 'shape':
      return getTextShapeBackgroundColor;
    default:
      return () => undefined;
  }
}

export async function pageBackgroundTextLowContrast(page) {
  // getting the background color can be async, prepare to resolve them with Promise.all
  const backgroundColorPromises = [];

  // for every element on the page, collect the text elements and check their background colors
  page.elements.forEach((element, index) => {
    // we don't need to check non-text elements and text that have a background mode
    if (element.type === 'text' && element.backgroundTextMode === 'NONE') {
      // get all the colors on the text spans
      const textStyleColors = getTextStyleColors(element);
      // all the elements "behind" the text element are potential background elements
      const potentialBackgroundElements = page.elements.slice(0, index);
      // get the background elements which overlap significantly with the text element
      const textBackgrounds = getBackgroundsForElement(
        element,
        potentialBackgroundElements,
        page
      );

      // loop through the background elements which overlap significantly with the text element
      for (const backgroundElement of textBackgrounds) {
        // elements with different types have different methods for comparing colors
        const getBackgroundColor = getBackgroundColorByType(backgroundElement)(
          // call that method to get the promise of a background color, or the background color itself
          {
            background: backgroundElement,
            text: element,
            page,
          }
        );

        // prepare background color promises for the textBackgroundHasLowContrast parameter
        const prepare = (getBackgroundColorResult) => {
          return (
            getBackgroundColorResult && {
              backgroundColor: getBackgroundColorResult,
              textStyleColors,
              fontSize: element.fontSize,
            }
          );
        };

        const bgColorCompare =
          getBackgroundColor instanceof Promise
            ? getBackgroundColor.then(prepare)
            : prepare(getBackgroundColor);

        backgroundColorPromises.push(bgColorCompare);
      }
    }
  });

  // resolve promises
  const bgColorComparisons = await Promise.all(backgroundColorPromises);

  return bgColorComparisons.some((compareObj) =>
    textBackgroundHasLowContrast(compareObj)
  );
}

function cleanupDOM({ elementId, pageId }) {
  const nodes = [
    document.getElementById(getImgNodeId(elementId)),
    document.getElementById(getImgNodeId(pageId)),
  ];
  nodes.forEach((node) => node?.remove());
}
