'use client';

import { Edit, Search, Visibility } from '@mui/icons-material';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
  type GridPaginationModel,
} from '@mui/x-data-grid';
import { frFR } from '@mui/x-data-grid/locales';
import type { User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { formatDateShort } from '@/lib/utils';
import { getUsers } from './actions';

const roleColors: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
  admin: 'error',
  staff: 'warning',
  mod: 'info',
  user: 'default',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<
    (User & { _count: { tournaments: number } })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search, 500);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { users: data, total: totalCount } = await getUsers(
        paginationModel.page + 1,
        paginationModel.pageSize,
        debouncedSearch,
      );
      setUsers(data);
      setTotal(totalCount);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [paginationModel, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Utilisateur',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={params.row.image || undefined}
            alt={params.row.name || ''}
            sx={{ width: 32, height: 32 }}
          >
            {params.row.name?.charAt(0)}
          </Avatar>
          <Typography fontWeight="bold" variant="body2">
            {params.row.name || 'Anonyme'}
          </Typography>
        </Box>
      ),
    },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    {
      field: 'role',
      headerName: 'Rôle',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value || 'user'}
          color={roleColors[params.value as string] || 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Inscrit le',
      width: 150,
      valueFormatter: (params) =>
        formatDateShort(new Date(params as unknown as string)),
    },
    {
      field: 'tournaments',
      headerName: 'Tournois',
      width: 100,
      valueGetter: (_value, row) => row._count.tournaments,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="view"
          icon={<Visibility />}
          label="Voir le profil"
          onClick={() => router.push(`/dashboard/profile/${params.id}`)}
        />,
        <GridActionsCellItem
          key="edit"
          icon={<Edit />}
          label="Éditer"
          showInMenu
          disabled // Action not implemented yet
        />,
      ],
    },
  ];

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Utilisateurs
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Gérez les utilisateurs de la plateforme ({total} au total)
      </Typography>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Rechercher un utilisateur (nom ou email)..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          height: 600,
          width: '100%',
        }}
      >
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          rowCount={total}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          density="comfortable"
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              borderColor: 'divider',
            },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'action.hover',
              fontWeight: 'bold',
            },
          }}
        />
      </Card>
    </Box>
  );
}
