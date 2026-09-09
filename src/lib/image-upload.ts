/**
 * Upload an image file to CDN via the /api/upload endpoint
 * Handles both browser File objects and resizing
 */
export async function uploadImageToCDN(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Upload failed');
  }

  const { url } = await response.json();
  return url;
}

/**
 * Resize an image file and return as blob
 * This prepares the file for upload while keeping file size reasonable
 */
export async function resizeImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Could not load that image.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        const scale = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not create blob from canvas.'));
              return;
            }
            // Create a new File object from the blob
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
            });
            resolve(resizedFile);
          },
          'image/jpeg',
          quality,
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Resize image and upload to CDN
 * Returns the CDN URL
 */
export async function resizeAndUploadImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
): Promise<string> {
  try {
    // Resize the image
    const resizedFile = await resizeImageFile(file, maxWidth, maxHeight, 0.85);
    
    // Upload to CDN
    const cdnUrl = await uploadImageToCDN(resizedFile);
    
    return cdnUrl;
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
}

export type ImageEditOptions = {
  crop: "original" | "square" | "wide" | "portrait";
  cropWidth: number;
  cropHeight: number;
  zoom: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  positionX: number;
  positionY: number;
  focus: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  opacity: number;
  preset: string;
  overlayColor: string;
  overlayOpacity: number;
};

export async function renderEditedImageFile(
  file: File,
  options: ImageEditOptions,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not load that image."));
      image.onload = () => {
        let cropWidth = image.width * (options.cropWidth / 100);
        let cropHeight = image.height * (options.cropHeight / 100);
        const zoom = Math.max(1, options.zoom);
        cropWidth /= zoom;
        cropHeight /= zoom;
        const angle = ((options.rotation % 360) * Math.PI) / 180;
        const outputWidth = Math.min(1800, Math.round(cropWidth));
        const outputHeight = Math.min(1800, Math.round(cropHeight));
        const canvas = document.createElement("canvas");
        canvas.width = outputWidth;
        canvas.height = outputHeight;
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("Could not edit that image."));
        context.save();
        context.translate(outputWidth / 2, outputHeight / 2);
        context.rotate(angle);
        context.scale(options.flipX ? -1 : 1, options.flipY ? -1 : 1);
        context.globalAlpha = options.opacity / 100;
        const scale = Math.max(outputWidth / cropWidth, outputHeight / cropHeight);
        const presets: Record<string, string> = {
          grayscale: "grayscale(1)",
          sepia: "sepia(.75)",
          vintage: "sepia(.35) saturate(.8) contrast(.95)",
          warm: "sepia(.18) saturate(1.25) hue-rotate(-8deg)",
          cool: "saturate(.85) hue-rotate(12deg)",
          blur: "blur(3px)",
          invert: "invert(1)",
          bright: "brightness(1.18) contrast(1.05)",
          pop: "saturate(1.45) contrast(1.12)",
        };
        context.filter = `${presets[options.preset] || ""} brightness(${options.brightness}%) contrast(${options.contrast}%) saturate(${options.saturation}%) hue-rotate(${options.hue}deg) blur(${options.blur}px)`;
        const sourceX = (image.width - cropWidth) * (options.positionX / 100);
        const sourceY = (image.height - cropHeight) * ((options.positionY * 0.7 + options.focus * 0.3) / 100);
        context.drawImage(image, -sourceX * scale - outputWidth / 2, -sourceY * scale - outputHeight / 2, image.width * scale, image.height * scale);
        context.restore();
        if (options.overlayOpacity > 0) {
          context.globalAlpha = options.overlayOpacity / 100;
          context.fillStyle = options.overlayColor;
          context.fillRect(0, 0, outputWidth, outputHeight);
          context.globalAlpha = 1;
        }
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("Could not create the edited image."));
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, "") + "-edited.jpg", { type: "image/jpeg" }));
        }, "image/jpeg", 0.88);
      };
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a file (not necessarily an image) to CDN
 * Useful for PDFs, resumes, etc.
 */
export async function uploadFileToCDN(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Upload failed');
  }

  const { url } = await response.json();
  return url;
}
