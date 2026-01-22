'use client';

import { Delete, InsertDriveFile } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui';
import type { DriveFile } from '@/lib/google-drive';
import { deleteDriveFile, listDriveFiles } from './actions';

export default function AdminDrivePage() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await listDriveFiles();
    if (error) {
      setError(error);
    } else {
      setFiles(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    setDeletingId(id);
    const { success, error } = await deleteDriveFile(id);

    if (success) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } else {
      alert(error || 'Failed to delete file');
    }
    setDeletingId(null);
  };

  return (
    <Box sx={{ py: 4 }}>
      <PageHeader
        title="Google Drive Manager"
        description="Manage images and files in the configured Drive folder."
      >
        <Button
          variant="contained"
          onClick={fetchFiles}
          startIcon={<InsertDriveFile />}
        >
          Refresh List
        </Button>
      </PageHeader>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ py: 4 }}>
          <Typography color="error" variant="h6" gutterBottom>
            Error loading files
          </Typography>
          <Typography color="error">{error}</Typography>
          {error.includes('credentials') && (
            <Typography sx={{ mt: 2 }} color="text.secondary">
              Please ensure <code>GOOGLE_APPLICATION_CREDENTIALS</code> is set in your environment variables.
            </Typography>
          )}
        </Box>
      ) : files.length === 0 ? (
        <Typography>No files found.</Typography>
      ) : (
        <Grid container spacing={3}>
          {files.map((file) => (
            <Grid key={file.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card variant="outlined">
                {file.thumbnailLink ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={file.thumbnailLink.replace('=s220', '=s600')} // High res thumbnail
                    alt={file.name}
                    sx={{
                      objectFit: 'contain',
                      p: 2,
                      bgcolor: 'background.paper',
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'action.hover',
                    }}
                  >
                    <InsertDriveFile
                      sx={{ fontSize: 64, color: 'text.secondary' }}
                    />
                  </Box>
                )}
                <CardContent>
                  <Typography variant="subtitle2" noWrap title={file.name}>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {file.mimeType}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between' }}>
                  {file.webViewLink && (
                    <Button
                      size="small"
                      href={file.webViewLink}
                      target="_blank"
                    >
                      View in Drive
                    </Button>
                  )}
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(file.id)}
                    disabled={deletingId === file.id}
                  >
                    {deletingId === file.id ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Delete />
                    )}
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
