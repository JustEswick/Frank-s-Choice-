export function isMobile(scene) {
  return scene.scale.width < 768;
}

export function isTablet(scene) {
  const width = scene.scale.width;
  return width >= 768 && width < 1024;
}

export function getLayout(scene) {
  const width = scene.scale.width;
  if (width < 768) return 'mobile';
  if (width >= 768 && width < 1024) return 'tablet';
  return 'desktop';
}
