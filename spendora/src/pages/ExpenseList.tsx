import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  MenuItem,
  Box,
  Typography,
  Button,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { db, Expense, Category } from '../db/database';
import { saveAs } from 'file-saver';

const ExpenseList: React.FC = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const [expensesData, categoriesData] = await Promise.all([
        db.expenses.orderBy('date').reverse().toArray(),
        db.categories.toArray(),
      ]);
      setExpenses(expensesData);
      setCategories(categoriesData);
    };

    loadData();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await db.expenses.delete(id);
      setExpenses(expenses.filter(expense => expense.id !== id));
    }
  };

  // Export data as CSV
  const handleExport = async () => {
    const expenses = await db.expenses.toArray();
    if (expenses.length === 0) {
      alert('No expenses to export.');
      return;
    }
    const header = ['id', 'title', 'amount', 'category', 'date', 'receipt_uri', 'created_at', 'updated_at'];
    const rows = expenses.map(e => [
      e.id ?? '',
      '"' + (e.title ?? '').replace(/"/g, '""') + '"',
      e.amount ?? '',
      '"' + (e.category ?? '').replace(/"/g, '""') + '"',
      e.date ? new Date(e.date).toISOString() : '',
      '"' + (e.receipt_uri ?? '').replace(/"/g, '""') + '"',
      e.created_at ? new Date(e.created_at).toISOString() : '',
      e.updated_at ? new Date(e.updated_at).toISOString() : '',
    ]);
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, 'spendora-expenses.csv');
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
        Expense History
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button variant="outlined" onClick={handleExport}>Export Data</Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <TextField
          select
          label="Category"
          variant="outlined"
          size="small"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All Categories</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.name}>
              {category.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{format(expense.date, 'MMM dd, yyyy')}</TableCell>
                <TableCell>{expense.title}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell align="right">${expense.amount.toFixed(2)}</TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/expenses/edit/${expense.id}`)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(expense.id!)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ExpenseList; 