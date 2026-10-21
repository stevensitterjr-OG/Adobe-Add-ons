/* Pure planning functions shared by the panel and Node tests. */
const MAX_DIMENSION = 300000;
function planResize(width, height, options) {
  if (![width, height].every(v => Number.isInteger(v) && v > 0)) {
    throw new Error('Open a document with valid pixel dimensions.');
  }
  const value = Number(options.value);
  if (!Number.isFinite(value) || value <= 0) throw new Error('Enter a positive size.');
  if (!['scale', 'width', 'height'].includes(options.mode)) throw new Error('Choose a valid size mode.');
  const ratio = options.mode === 'width' ? value / width : options.mode === 'height' ? value / height : value;
  const targetWidth = Math.round(width * ratio);
  const targetHeight = Math.round(height * ratio);
  if (ratio <= 1 || targetWidth <= width || targetHeight <= height) {
    throw new Error('Choose a size larger than the current image.');
  }
  if (Math.max(targetWidth, targetHeight) > MAX_DIMENSION) {
    throw new Error('Photoshop supports at most 300,000 pixels on either side.');
  }
  const methods = { details: 'deepUpscale', smooth: 'bicubicSmoother', nearest: 'nearestNeighbor' };
  if (!Object.hasOwn(methods, options.method)) throw new Error('Choose a valid resampling method.');
  const noise = Number(options.noise);
  if (!Number.isFinite(noise) || noise < 0 || noise > 100) throw new Error('Noise reduction must be between 0 and 100.');
  return { width: targetWidth, height: targetHeight, interpolation: methods[options.method], noise, ratio,
    megapixels: targetWidth * targetHeight / 1e6 };
}
function imageSizeDescriptor(plan) {
  const descriptor = {
    _obj: 'imageSize',
    width: { _unit: 'pixelsUnit', _value: plan.width },
    height: { _unit: 'pixelsUnit', _value: plan.height },
    constrainProportions: true,
    scaleStyles: true,
    interpolation: { _enum: 'interpolationType', _value: plan.interpolation },
    _options: { dialogOptions: 'dontDisplay' }
  };
  if (plan.interpolation === 'deepUpscale') descriptor.noise = plan.noise;
  return descriptor;
}
module.exports = { planResize, imageSizeDescriptor };
