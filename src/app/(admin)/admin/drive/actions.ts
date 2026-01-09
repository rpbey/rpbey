'use server';

import { revalidatePath } from 'next/cache';
import { type DriveFile, googleDriveService } from '@/lib/google-drive';

export async function listDriveFiles(): Promise<{
  data?: DriveFile[];
  error?: string;
}> {
  try {
    const files = await googleDriveService.listFiles();
    return { data: files };
  } catch (error) {
    console.error('Failed to list drive files:', error);
    return { error: 'Failed to fetch files from Google Drive.' };
  }
}

export async function deleteDriveFile(
  fileId: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await googleDriveService.deleteFile(fileId);
    revalidatePath('/admin/drive');
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete file ${fileId}:`, error);
    return { error: 'Failed to delete file.' };
  }
}
