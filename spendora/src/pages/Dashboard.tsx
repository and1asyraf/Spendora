import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem, TextField, Alert, Button, LinearProgress } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';
import { db, Expense } from '../db/database';
import { format, startOfMonth, endOfMonth, isToday } from 'date-fns';
import { saveAs } from 'file-saver';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const Dashboard: React.FC = () => {
  const [filter, setFilter] = useState<'today' | 'month' | 'all'>('month');
  const [total, setTotal] = useState(0);
  const [categoryData, setCategoryData] = useState<{ [key: string]: number }>({});
  const [dailyData, setDailyData] = useState<{ [key: string]: number }>({});
  const [budget, setBudget] = useState<number>(() => {
    const stored = localStorage.getItem('monthlyBudget');
    return stored ? Number(stored) : 0;
  });
  const [budgetInput, setBudgetInput] = useState(budget.toString());
  const [showAlert, setShowAlert] = useState(false);
  const [savingsGoal, setSavingsGoal] = useState<number>(() => {
    const stored = localStorage.getItem('monthlySavingsGoal');
    return stored ? Number(stored) : 0;
  });
  const [savingsGoalInput, setSavingsGoalInput] = useState(savingsGoal.toString());

  useEffect(() => {
    const loadDashboardData = async () => {
      let expenses: Expense[] = [];
      const now = new Date();
      if (filter === 'today') {
        expenses = (await db.expenses.toArray()).filter(e => isToday(e.date));
      } else if (filter === 'month') {
        const startDate = startOfMonth(now);
        const endDate = endOfMonth(now);
        expenses = await db.expenses.where('date').between(startDate, endDate).toArray();
      } else {
        expenses = await db.expenses.toArray();
      }

      // Calculate total
      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      setTotal(total);

      // Calculate category totals
      const categories: { [key: string]: number } = {};
      expenses.forEach(expense => {
        categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
      });
      setCategoryData(categories);

      // Calculate daily totals
      const daily: { [key: string]: number } = {};
      expenses.forEach(expense => {
        const date = format(expense.date, 'yyyy-MM-dd');
        daily[date] = (daily[date] || 0) + expense.amount;
      });
      setDailyData(daily);
    };

    loadDashboardData();
  }, [filter]);

  useEffect(() => {
    if (filter === 'month' && budget > 0 && total > budget) {
      setShowAlert(true);
    } else {
      setShowAlert(false);
    }
  }, [total, budget, filter]);

  const handleBudgetSave = () => {
    const value = Number(budgetInput);
    if (!isNaN(value) && value >= 0) {
      setBudget(value);
      localStorage.setItem('monthlyBudget', value.toString());
    }
  };

  const handleSavingsGoalSave = () => {
    const value = Number(savingsGoalInput);
    if (!isNaN(value) && value >= 0) {
      setSavingsGoal(value);
      localStorage.setItem('monthlySavingsGoal', value.toString());
    }
  };

  // Export data as JSON
  const handleExport = async () => {
    const expenses = await db.expenses.toArray();
    const categories = await db.categories.toArray();
    const data = { expenses, categories };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    saveAs(blob, 'spendora-backup.json');
  };

  // Import data from JSON
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data.expenses) && Array.isArray(data.categories)) {
        await db.expenses.clear();
        await db.categories.clear();
        await db.expenses.bulkAdd(data.expenses);
        await db.categories.bulkAdd(data.categories);
        window.location.reload();
      } else {
        alert('Invalid backup file.');
      }
    } catch (e) {
      alert('Failed to import backup.');
    }
  };

  const pieChartData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        data: Object.values(categoryData),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
        ],
      },
    ],
  };

  const lineChartData = {
    labels: Object.keys(dailyData).sort(),
    datasets: [
      {
        label: 'Daily Expenses',
        data: Object.keys(dailyData).sort().map(date => dailyData[date]),
        fill: false,
        borderColor: '#1976d2',
        tension: 0.1,
      },
    ],
  };

  const savings = budget > 0 ? Math.max(budget - total, 0) : 0;
  const savingsPercent = savingsGoal > 0 ? Math.min((savings / savingsGoal) * 100, 100) : 0;
  const savingsOnTrack = savings >= savingsGoal && savingsGoal > 0;

  return (
    <Grid spacing={3}>
      <Grid>
        {filter === 'month' && savingsGoal > 0 && budget > 0 && (
          <Box sx={{ mb: 2, width: '100%', maxWidth: 400, mx: 'auto' }}>
            <Typography align="center" variant="subtitle1" sx={{ mb: 1 }}>
              Savings Progress: ${savings.toFixed(2)} / ${savingsGoal.toFixed(2)}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={savingsPercent}
              sx={{ height: 12, borderRadius: 6, backgroundColor: '#eee',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: savingsOnTrack ? 'success.main' : 'error.main',
                },
              }}
            />
            <Typography align="center" variant="body2" color={savingsOnTrack ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
              {savingsOnTrack ? 'You reached your savings goal!' : 'Keep saving to reach your goal!'}
            </Typography>
          </Box>
        )}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', width: '100%' }}>
          <FormControl size="small">
            <InputLabel id="filter-label">Period</InputLabel>
            <Select
              labelId="filter-label"
              value={filter}
              label="Period"
              onChange={e => setFilter(e.target.value as 'today' | 'month' | 'all')}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
            {filter === 'today' ? 'Today\'s Summary' : filter === 'month' ? 'Monthly Summary' : 'All Time Summary'}
          </Typography>
          <Typography variant="h4" align="center">
            ${total.toFixed(2)}
          </Typography>
          {filter === 'month' && budget > 0 && (
            <Typography variant="subtitle1" color={total > budget ? 'error' : 'text.secondary'} align="center">
              Budget: ${budget.toFixed(2)}
            </Typography>
          )}
        </Paper>
      </Grid>

      <Grid>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
            Expenses by Category
          </Typography>
          <Pie data={pieChartData} />
        </Paper>
      </Grid>

      <Grid>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
            Daily Expenses
          </Typography>
          <Line data={lineChartData} />
        </Paper>
        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Monthly Budget"
              size="small"
              type="number"
              value={budgetInput}
              onChange={e => setBudgetInput(e.target.value)}
              sx={{ minWidth: 120 }}
              inputProps={{ min: 0 }}
            />
            <Button variant="contained" size="small" onClick={handleBudgetSave}>
              Save
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Savings Goal"
              size="small"
              type="number"
              value={savingsGoalInput}
              onChange={e => setSavingsGoalInput(e.target.value)}
              sx={{ minWidth: 120 }}
              inputProps={{ min: 0 }}
            />
            <Button variant="contained" size="small" onClick={handleSavingsGoalSave}>
              Save
            </Button>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Dashboard; 