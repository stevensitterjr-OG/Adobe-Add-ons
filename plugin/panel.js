const { app, core, action } = require('photoshop');
const { entrypoints } = require('uxp');
const { planResize, imageSizeDescriptor } = require('./upscale');
const $ = id => document.getElementById(id);
let busy = false;
function options() {
  return { mode: $('mode').value, value: $('value').value, method: $('method').value, noise: $('noise').value };
}
function currentDocument() {
  if (!app.documents.length) throw new Error('Open an image in Photoshop first.');
  return app.activeDocument;
}
function status(message, error = false) {
  $('status').textContent = message;
  $('status').className = error ? 'error' : '';
}
function refresh() {
  if (busy) return;
  $('noise').disabled = $('method').value !== 'details';
  try {
    const doc = currentDocument();
    $('document').textContent = `${doc.title} · ${doc.width.toLocaleString()} × ${doc.height.toLocaleString()} px`;
    const plan = planResize(doc.width, doc.height, options());
    $('preview').textContent = `${plan.width.toLocaleString()} × ${plan.height.toLocaleString()} px · ${plan.megapixels.toFixed(1)} MP${plan.megapixels > 100 ? ' · Large output: allow extra time and memory.' : ''}`;
    $('upscale').disabled = false;
  } catch (error) {
    $('preview').textContent = error.message;
    $('upscale').disabled = true;
    if (!app.documents.length) $('document').textContent = 'Open an image in Photoshop.';
  }
}
async function upscale() {
  if (busy) return;
  busy = true;
  $('upscale').disabled = true;
  $('upscale').textContent = 'Upscaling…';
  status('Working locally… Please wait for the Done message.');
  const settings = options();
  const duplicate = $('duplicate').checked;
  let copyCreated = false;
  try {
    // Let the panel paint its working state before Photoshop begins processing.
    await new Promise(resolve => setTimeout(resolve, 50));
    const sourceId = currentDocument().id;
    await core.executeAsModal(async executionContext => {
      const source = currentDocument();
      if (source.id !== sourceId) throw new Error('The active document changed. Refresh and try again.');
      const plan = planResize(source.width, source.height, settings);
      let target = source;
      if (duplicate) {
        target = await source.duplicate(`${source.title} — ${plan.ratio.toFixed(2)}x`);
        copyCreated = true;
        app.activeDocument = target;
      }
      const suspension = await executionContext.hostControl.suspendHistory({ documentID: target.id, name: 'Local Upscale' });
      let success = false;
      try {
        const result = await action.batchPlay([imageSizeDescriptor(plan)], {});
        if (result[0]?._obj === 'error') throw new Error(result[0].message || 'Photoshop rejected the resize.');
        if (target.width !== plan.width || target.height !== plan.height) throw new Error('Photoshop returned unexpected output dimensions.');
        success = true;
      } finally {
        await executionContext.hostControl.resumeHistory(suspension, success);
      }
      status(`Done · ${plan.width.toLocaleString()} × ${plan.height.toLocaleString()} px${duplicate ? ' · Original preserved.' : ' · Undo with Ctrl+Z.'}`);
    }, { commandName: 'Local Upscale' });
  } catch (error) {
    status(`${error.message || error}${copyCreated ? ' The duplicate remains open; the original is preserved.' : ''} If Preserve Details 2.0 is unavailable, try Bicubic Smoother.`, true);
  } finally {
    busy = false;
    $('upscale').textContent = 'Upscale image';
    refresh();
  }
}
$('upscale').addEventListener('click', upscale);
$('refresh').addEventListener('click', refresh);
for (const id of ['mode', 'value', 'method', 'noise']) {
  $(id).addEventListener('change', () => {
    if (id === 'mode') {
      const mode = $('mode').value;
      $('value-label').textContent = mode === 'scale' ? 'Multiplier' : 'Target pixels';
      $('value').step = mode === 'scale' ? '0.25' : '1';
      $('value').min = mode === 'scale' ? '1.01' : '1';
      try { const doc = currentDocument(); $('value').value = mode === 'scale' ? '2' : String(doc[mode] * 2); } catch (_) { /* No document yet. */ }
    }
    refresh();
  });
}
for (const factor of [2, 4, 6]) $('scale' + factor).addEventListener('click', () => {
  $('mode').value = 'scale';
  $('value-label').textContent = 'Multiplier';
  $('value').min = '1.01';
  $('value').step = '0.25';
  $('value').value = String(factor);
  refresh();
});
entrypoints.setup({ panels: { localUpscale: { show: refresh } } });
action.addNotificationListener(['open', 'close', 'select', 'imageSize'], refresh);
refresh();
