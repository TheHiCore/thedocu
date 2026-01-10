/**
 * Compress an image to 300 PPI (for A4 documents)
 * A4 at 300 PPI = 2480 x 3508 pixels
 */
export async function compressImageTo300PPI(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        // A4 at 300 PPI dimensions
        const targetWidth = 2480;
        const targetHeight = 3508;

        // Create canvas with target dimensions
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Set canvas to target dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Calculate scaling to cover the canvas while maintaining aspect ratio
        const imgAspect = img.width / img.height;
        const canvasAspect = targetWidth / targetHeight;

        let drawWidth: number;
        let drawHeight: number;
        let offsetX = 0;
        let offsetY = 0;

        if (imgAspect > canvasAspect) {
          // Image is wider, fit height and crop width
          drawHeight = targetHeight;
          drawWidth = img.width * (targetHeight / img.height);
          offsetX = (targetWidth - drawWidth) / 2;
        } else {
          // Image is taller, fit width and crop height
          drawWidth = targetWidth;
          drawHeight = img.height * (targetWidth / img.width);
          offsetY = (targetHeight - drawHeight) / 2;
        }

        // Draw the image scaled to cover the canvas
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Convert to JPEG with quality compression
        const quality = 0.85; // Good quality while reducing file size
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);

        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
