
/**
 * Compresses a base64 image string by resizing it and reducing its quality.
 * @param base64 The original base64 image string.
 * @param maxWidth The maximum width of the compressed image.
 * @param quality The quality of the compressed image (0 to 1).
 * @returns A promise that resolves to the compressed base64 image string.
 */
export const compressImage = (base64: string, maxWidth = 400, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64 || !base64.startsWith('data:image')) {
      resolve(base64);
      return;
    }
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64);
  });
};
