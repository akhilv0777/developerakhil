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
