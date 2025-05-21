import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Typography,
  Paper,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { db, Category, Expense } from '../db/database';

const EditExpense: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    date: new Date(),
  });
  const [errors, setErrors] = useState({
    title: '',
    amount: '',
    category: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [expense, categoriesData] = await Promise.all([
          db.expenses.get(Number(id)),
          db.categories.toArray(),
        ]);

        if (!expense) {
          alert('Expense not found');
          navigate('/expenses');
          return;
        }

        setFormData({
          title: expense.title,
          amount: expense.amount.toString(),
          category: expense.category,
          date: expense.date,
        });
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading expense:', error);
        alert('Failed to load expense data');
        navigate('/expenses');
      }
    };

    loadData();
  }, [id, navigate]);

  const validateForm = () => {
    const newErrors = {
      title: '',
      amount: '',
      category: '',
    };

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await db.expenses.update(Number(id), {
        title: formData.title,
        amount: Number(formData.amount),
        category: formData.category,
        date: formData.date,
        updated_at: new Date(),
      });

      navigate('/expenses');
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Failed to update expense. Please try again.');
    }
  };

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    setFormData({
      ...formData,
      [field]: e.target.value,
    });
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Edit Expense
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Title"
              value={formData.title}
              onChange={handleChange('title')}
              error={!!errors.title}
              helperText={errors.title}
              fullWidth
            />

            <TextField
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={handleChange('amount')}
              error={!!errors.amount}
              helperText={errors.amount}
              fullWidth
              InputProps={{
                startAdornment: '$',
              }}
            />

            <TextField
              select
              label="Category"
              value={formData.category}
              onChange={handleChange('category')}
              error={!!errors.category}
              helperText={errors.category}
              fullWidth
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.name}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={(newValue) => {
                  setFormData({
                    ...formData,
                    date: newValue || new Date(),
                  });
                }}
              />
            </LocalizationProvider>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/expenses')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
              >
                Update Expense
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default EditExpense; 