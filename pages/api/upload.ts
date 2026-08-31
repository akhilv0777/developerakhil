import type { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import { getSessionUser } from '../../src/lib/api-server/auth';

export const config = {
  api: {
    bodyParser: false,
  },
};

type ResponseData = 
  | { url: string; filename: string }
  | { error: string };

/**
 * POST /api/upload
 * Uploads a file to Vercel Blob and returns its public CDN URL.
 *
 * Requires either:
 * - BLOB_READ_WRITE_TOKEN
 * - or Vercel OIDC + BLOB_STORE_ID / process.env.BLOB_STORE_ID
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const username = await getSessionUser(req);
    if (!username) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const { default: busboy } = await import('busboy');
    const bb = busboy({ headers: req.headers });

    let uploadedFile: Buffer | null = null;
    let filename = 'upload';
    let mimetype = 'application/octet-stream';

    await new Promise<void>((resolve, reject) => {
      bb.on('file', (fieldname: string, file: NodeJS.ReadableStream, info: { filename: string; mimeType: string }) => {
        filename = info.filename;
        mimetype = info.mimeType;

        const chunks: Buffer[] = [];
        file.on('data', (chunk: Buffer) => chunks.push(chunk));
        file.on('end', () => {
          uploadedFile = Buffer.concat(chunks);
        });
        file.on('error', reject);
      });

      bb.on('close', resolve);
      bb.on('error', reject);

      req.pipe(bb);
    });

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const hasBlobConfig = !!process.env.BLOB_READ_WRITE_TOKEN || !!process.env.BLOB_STORE_ID || !!process.env.VERCEL_OIDC_TOKEN;
    if (!hasBlobConfig) {
      return res.status(500).json({
        error: 'Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN or set BLOB_STORE_ID with Vercel OIDC.',
      });
    }

    const extension = filename.includes('.')
      ? filename.slice(filename.lastIndexOf('.'))
      : '';
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`;

    const blob = await put(uniqueFilename, uploadedFile, {
      access: 'public',
      contentType: mimetype,
      addRandomSuffix: false,
    });

    return res.status(200).json({
      url: blob.url,
      filename: uniqueFilename,
    });
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return res.status(500).json({ error: message });
  }
}
