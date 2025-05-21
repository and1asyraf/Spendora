import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  Container,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Home as HomeIcon,
  List as ListIcon,
  Add as AddIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';

interface LayoutProps {
  children: React.ReactNode;
  toggleColorMode: () => void;
  mode: 'light' | 'dark';
}

const Layout: React.FC<LayoutProps> = ({ children, toggleColorMode, mode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Spendora
          </Typography>
          <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton color="inherit" onClick={toggleColorMode}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>

      <BottomNavigation
        value={location.pathname}
        onChange={(_, newValue) => {
          navigate(newValue);
        }}
        showLabels
        sx={{ width: '100%' }}
      >
        <BottomNavigationAction
          label="Home"
          value="/"
          icon={<HomeIcon />}
        />
        <BottomNavigationAction
          label="Expenses"
          value="/expenses"
          icon={<ListIcon />}
        />
        <BottomNavigationAction
          label="Add"
          value="/expenses/add"
          icon={<AddIcon />}
        />
      </BottomNavigation>
    </Box>
  );
};

export default Layout; 