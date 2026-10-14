export async function preparePhoto(uri: string): Promise<string> {
  const image = new Image();
  image.src = uri;
  await image.decode();
  const ratio = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法处理照片');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  // Persist image bytes, never a temporary blob URL that breaks on reload.
  const result = canvas.toDataURL('image/jpeg', 0.8);
  if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
  return result;
}
