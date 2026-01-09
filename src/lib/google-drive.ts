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
      const res = await this.drive.files.list({
        q: `'${FOLDER_ID}' in parents and trashed = false`,
        orderBy: 'createdTime desc',
        pageSize: 100, // Adjust as needed
        fields:
          'files(id, name, webViewLink, webContentLink, thumbnailLink, mimeType, size, createdTime)',
      });

      return (res.data.files as DriveFile[]) || [];
    } catch (error) {
      console.error('Error listing Drive files:', error);
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
