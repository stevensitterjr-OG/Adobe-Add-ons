const { test } = require('node:test');
const assert = require('node:assert/strict');
const { planResize, imageSizeDescriptor } = require('../plugin/upscale');
const base = { mode: 'scale', value: 2, method: 'details', noise: 10 };
test('2x resize preserves dimensions and emits native Photoshop command', () => {
  const p = planResize(1920, 1080, base);
  assert.equal(p.width, 3840);
  assert.equal(p.height, 2160);
  assert.deepEqual(imageSizeDescriptor(p), {
    _obj: 'imageSize', width: { _unit: 'pixelsUnit', _value: 3840 },
    height: { _unit: 'pixelsUnit', _value: 2160 }, constrainProportions: true, scaleStyles: true,
    interpolation: { _enum: 'interpolationType', _value: 'deepUpscale' },
    _options: { dialogOptions: 'dontDisplay' }, noise: 10
  });
});
test('target width and height maintain aspect ratio with integer rounding', () => {
  assert.equal(planResize(1000, 333, { ...base, mode: 'width', value: 2001 }).height, 666);
  assert.equal(planResize(1000, 500, { ...base, mode: 'height', value: 1500 }).width, 3000);
});
test('pixel art and smoother descriptors omit unsupported noise property', () => {
  for (const [method, interpolation] of [['nearest', 'nearestNeighbor'], ['smooth', 'bicubicSmoother']]) {
    const d = imageSizeDescriptor(planResize(100, 100, { ...base, method }));
    assert.equal(d.interpolation._value, interpolation);
    assert.equal(Object.hasOwn(d, 'noise'), false);
  }
});
test('rejects invalid, smaller, and oversized results', () => {
  for (const value of [0, -1, 1, 0.5, NaN, Infinity, '', 'abc', 4000]) {
    assert.throws(() => planResize(100, 100, { ...base, value }));
  }
  assert.throws(() => planResize(0, 100, base));
  assert.throws(() => planResize(100, 100, { ...base, mode: 'other' }));
  assert.throws(() => planResize(100, 100, { ...base, method: 'other' }));
  assert.throws(() => planResize(100, 100, { ...base, noise: 101 }));
  assert.throws(() => planResize(100, 100, { ...base, noise: -1 }));
});
test('accepts Photoshop dimension boundary', () => {
  assert.equal(planResize(150000, 100, base).width, 300000);
});
test('manifest connects the panel to a supported Photoshop host', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '../plugin');
  const manifest = require('../plugin/manifest.json');
  assert.equal(manifest.host[0].app, 'PS');
  assert.equal(manifest.manifestVersion, 5);
  assert.equal(manifest.entrypoints[0].id, 'localUpscale');
  assert.ok(fs.existsSync(path.join(root, manifest.main)));
  assert.equal(manifest.requiredPermissions, undefined);
});
