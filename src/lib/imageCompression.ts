import * as pdfjsLib from "pdfjs-dist";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

/**
 * Compress an image to 300 PPI (for A4 documents)
 * A4 at 300 PPI = 2480 x 3508 pixels (portrait) or 3508 x 2480 pixels (landscape)
 */
export async function compressImageTo300PPI(
  file: File,
  orientation: "portrait" | "landscape" = "portrait"
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Handle PDF files
    if (file.type === "application/pdf") {
      handlePdfFile(file, orientation).then(resolve).catch(reject);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        // A4 at 300 PPI dimensions based on orientation
        const targetWidth = orientation === "landscape" ? 3508 : 2480;
        const targetHeight = orientation === "landscape" ? 2480 : 3508;

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

        // Calculate scaling to fit the canvas while maintaining aspect ratio (contain, not cover)
        const imgAspect = img.width / img.height;
        const canvasAspect = targetWidth / targetHeight;

        let drawWidth: number;
        let drawHeight: number;
        let offsetX = 0;
        let offsetY = 0;

        if (imgAspect > canvasAspect) {
          // Image is wider, fit width and center vertically
          drawWidth = targetWidth;
          drawHeight = img.height * (targetWidth / img.width);
          offsetY = (targetHeight - drawHeight) / 2;
        } else {
          // Image is taller, fit height and center horizontally
          drawHeight = targetHeight;
          drawWidth = img.width * (targetHeight / img.height);
          offsetX = (targetWidth - drawWidth) / 2;
        }

        // Fill with white background first
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Draw the image scaled to fit the canvas (contain)
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

/**
 * Handle PDF file and convert first page to image
 */
async function handlePdfFile(
  file: File,
  orientation: "portrait" | "landscape"
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  // A4 at 300 PPI dimensions based on orientation
  const targetWidth = orientation === "landscape" ? 3508 : 2480;
  const targetHeight = orientation === "landscape" ? 2480 : 3508;

  // Get page dimensions and calculate scale
  const viewport = page.getViewport({ scale: 1 });
  const scaleX = targetWidth / viewport.width;
  const scaleY = targetHeight / viewport.height;
  const scale = Math.min(scaleX, scaleY);

  const scaledViewport = page.getViewport({ scale });

  // Create canvas
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Fill with white background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Center the PDF page
  const offsetX = (targetWidth - scaledViewport.width) / 2;
  const offsetY = (targetHeight - scaledViewport.height) / 2;
  ctx.translate(offsetX, offsetY);

  // Render the page
  await page.render({
    canvasContext: ctx,
    viewport: scaledViewport,
  }).promise;

  return canvas.toDataURL("image/jpeg", 0.92);
}
