'use client';

import { Add, Delete, Edit } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  IconButton,
  TextField,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import type { Part } from '@prisma/client';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader, useToast } from '@/components/ui';
import { deletePart, getParts, upsertPart } from './actions';
import { PartDialog } from './PartDialog';

export default function AdminPartsPage() {
  const [rows, setRows] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    const { parts } = await getParts(search);
    setRows(parts);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleEdit = (part: Part) => {
    setSelectedPart(part);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedPart(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: Partial<Part>) => {
    try {
      await upsertPart(data);
      showToast('Pièce sauvegardée', 'success');
      loadData();
    } catch {
      showToast('Erreur', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cette pièce ?')) {
      await deletePart(id);
      loadData();
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'imageUrl',
      headerName: 'Aperçu',
      width: 70,
      renderCell: (params) => (
        <Avatar
          src={params.value}
          variant="rounded"
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'transparent',
            border: '1px solid #333',
          }}
        >
          {params.row.name.charAt(0)}
        </Avatar>
      ),
    },
    { field: 'name', headerName: 'Nom', flex: 1 },
    { field: 'type', headerName: 'Type', width: 100 },
    { field: 'system', headerName: 'Système', width: 80 },
    { field: 'weight', headerName: 'Poids (g)', width: 100 },
    {
      field: 'updatedAt',
      headerName: 'MAJ',
      width: 120,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <>
          <IconButton size="small" onClick={() => handleEdit(params.row)}>
            <Edit />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Inventaire des Pièces"
        description="Gérez la base de données Beyblade X (Blades, Ratchets, Bits)"
      >
        <Button startIcon={<Add />} variant="contained" onClick={handleCreate}>
          Ajouter une pièce
        </Button>
      </PageHeader>

      <Box sx={{ mb: 2 }}>
        <TextField
          label="Rechercher"
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      <Card sx={{ height: 600 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
        />
      </Card>

      <PartDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedPart}
      />
    </Box>
  );
}
