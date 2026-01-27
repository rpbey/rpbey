import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive']; // Full scope for managing files
const FOLDER_ID = '1G2rl1vPVN20eL6-1CcSSJ6unys6rcxBM';

export interface DriveFile {
  id: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
}

export class GoogleDriveService {
  private drive;

  constructor() {
    const auth = new GoogleAuth({
      scopes: SCOPES,
    });
    this.drive = google.drive({ version: 'v3', auth });
  }

  /**
   * List files in the configured folder.
   */
  async listFiles(): Promise<DriveFile[]> {
    try {
      // Check if credentials are present in env to avoid hard crash
      if (
        !process.env.GOOGLE_APPLICATION_CREDENTIALS &&
        !process.env.GOOGLE_PRIVATE_KEY
      ) {
        console.warn('Google Drive credentials missing.');
        return []; // Return empty list instead of crashing, or mock data for dev
      }

      const res = await this.drive.files.list({
        q: `'${FOLDER_ID}' in parents and trashed = false`,
        orderBy: 'createdTime desc',
        pageSize: 100, // Adjust as needed
        fields:
          'files(id, name, webViewLink, webContentLink, thumbnailLink, mimeType, size, createdTime)',
      });

      return (res.data.files as DriveFile[]) || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error listing Drive files:', error);
      if (error.message?.includes('No key or keyFile')) {
        throw new Error(
          'Google Drive credentials missing. Please configure GOOGLE_APPLICATION_CREDENTIALS.',
        );
      }
      throw new Error('Failed to list files from Google Drive');
    }
  }

  /**
   * Delete a file by ID.
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId,
      });
    } catch (error) {
      console.error(`Error deleting file ${fileId}:`, error);
      throw new Error(`Failed to delete file ${fileId}`);
    }
  }
}

export const googleDriveService = new GoogleDriveService();
