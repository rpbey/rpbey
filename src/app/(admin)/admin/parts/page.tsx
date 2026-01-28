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
import { DataGrid, type GridColDef, type GridRowModel } from '@mui/x-data-grid';
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

  const processRowUpdate = async (newRow: GridRowModel) => {
    const updatedPart = newRow as Part;
    try {
      await upsertPart(updatedPart);
      showToast('Modification enregistrée', 'success');
      return updatedPart;
    } catch (error) {
      showToast('Erreur lors de la sauvegarde', 'error');
      throw error;
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
    { field: 'name', headerName: 'Nom', flex: 1, editable: true },
    {
      field: 'type',
      headerName: 'Type',
      width: 100,
      type: 'singleSelect',
      valueOptions: ['BLADE', 'RATCHET', 'BIT'],
      editable: true,
    },
    { field: 'system', headerName: 'Système', width: 80, editable: true },
    {
      field: 'weight',
      headerName: 'Poids (g)',
      width: 90,
      type: 'number',
      editable: true,
    },
    {
      field: 'beyType',
      headerName: 'Type Bey',
      width: 100,
      type: 'singleSelect',
      valueOptions: ['ATTACK', 'DEFENSE', 'STAMINA', 'BALANCE'],
      editable: true,
    },
    {
      field: 'spinDirection',
      headerName: 'Rotation',
      width: 90,
      editable: true,
    },
    // Stats Columns
    {
      field: 'attack',
      headerName: 'Atk',
      width: 60,
      editable: true,
    },
    {
      field: 'defense',
      headerName: 'Def',
      width: 60,
      editable: true,
    },
    {
      field: 'stamina',
      headerName: 'Sta',
      width: 60,
      editable: true,
    },
    {
      field: 'dash',
      headerName: 'Dash',
      width: 60,
      editable: true,
    },
    {
      field: 'burst',
      headerName: 'Burst',
      width: 60,
      editable: true,
    },
    {
      field: 'updatedAt',
      headerName: 'MAJ',
      width: 100,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
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
        description="Gérez la base de données Beyblade X (Tableur)"
      >
        <Button startIcon={<Add />} variant="contained" onClick={handleCreate}>
          Ajouter une pièce
        </Button>
      </PageHeader>

      <Box sx={{ mb: 2 }}>
        <TextField
          label="Rechercher (Nom, ID...)"
          size="small"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      <Card sx={{ height: '75vh' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(error) => console.error(error)}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          pageSizeOptions={[25, 50, 100]}
          sx={{
            '& .MuiDataGrid-cell--editable': {
              bgcolor: 'action.hover',
            },
          }}
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
