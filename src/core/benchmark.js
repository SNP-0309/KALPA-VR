/**
 * Genesis / KALPA - Quick GPU Benchmark
 * Runs a rapid 500ms offscreen rendering test to estimate GPU performance
 * and choose the optimal LOD preset (Low, Medium, High).
 */

export async function benchmarkGPU() {
  return new Promise((resolve) => {
    try {
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      const isHeadset = /Quest|Oculus|Pico|Vive/i.test(navigator.userAgent);

      if (isHeadset) {
        // VR headsets need maximum stability
        resolve('medium');
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

      if (!gl) {
        resolve('low');
        return;
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      let rendererStr = '';
      if (debugInfo) {
        rendererStr = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
      }

      // Check for integrated low-end GPUs
      const isIntelIntegrated = /Intel|HD Graphics|UHD Graphics/i.test(rendererStr);
      const isMaliOld = /Mali-4|Mali-T|Adreno 3|Adreno 50/i.test(rendererStr);

      if (isMaliOld) {
        resolve('low');
        return;
      }

      // Rapid timing test
      let frames = 0;
      const start = performance.now();
      function sample() {
        frames++;
        if (performance.now() - start < 250) {
          requestAnimationFrame(sample);
        } else {
          const fps = (frames / (performance.now() - start)) * 1000;
          if (isMobile) {
            resolve(fps > 50 && !isIntelIntegrated ? 'medium' : 'low');
          } else {
            if (fps > 52 && !isIntelIntegrated) {
              resolve('high');
            } else if (fps > 35) {
              resolve('medium');
            } else {
              resolve('low');
            }
          }
        }
      }
      requestAnimationFrame(sample);
    } catch {
      resolve('medium');
    }
  });
}
