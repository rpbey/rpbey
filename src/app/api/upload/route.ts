import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { join } from 'path';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure uploads directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    // We should probably check if directory exists, but assuming standard Next.js setup
    // let's just use unique filenames
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = file.name.split('.').pop();
    const filename = `deckbox-${session.user.id}-${uniqueSuffix}.${extension}`;
    const filepath = join(uploadDir, filename);

    // Note: In a real production env (like Vercel), local file writes don't persist.
    // However, for this VPS setup with Coolify/Docker, we should ideally map a volume.
    // For now, I'll write to public/uploads assuming it's writable.
    // If public/uploads doesn't exist, I should create it?
    // Let's rely on standard practice or create it if missing.

    // I'll add a check for the directory creation just in case
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 },
    );
  }
}
