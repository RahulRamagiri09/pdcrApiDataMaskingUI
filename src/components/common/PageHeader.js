import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../utils/auth';

const PageHeader = ({ title, marginX = -1 }) => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    handleClose();
    navigate('/login');
  };

  return (
    <Box
      mb={1}
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{
        backgroundColor: '#0b2677',
        p: 1.5,
        height: 56,
        mx: marginX,
        position: 'sticky',
        top: 0,
        zIndex: 1100,
      }}
    >
      <Typography variant="h5" sx={{ color: 'white', textAlign: 'center' }}>
        {title}
      </Typography>

      {/* Welcome Message + Profile Avatar - Right Side */}
      <Box sx={{ position: 'absolute', right: 16, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body1" sx={{ color: 'white' }}>
          Welcome back, <Box component="span" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{user?.username || 'User'}</Box>
        </Typography>
        <Box
          onMouseEnter={handleMenu}
          onMouseLeave={handleClose}
          sx={{ display: 'inline-block' }}
        >
          <IconButton sx={{ p: 0 }}>
            {user?.profilePicture ? (
              <Avatar
                alt={user.username}
                src={user.profilePicture}
                sx={{ width: 32, height: 32 }}
              />
            ) : (
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'white', color: '#0b2677' }}>
                <AccountCircleIcon />
              </Avatar>
            )}
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: { minWidth: 200, mt: 1 },
              onMouseEnter: () => setAnchorEl(anchorEl),
              onMouseLeave: handleClose,
            }}
            MenuListProps={{
              onMouseEnter: () => setAnchorEl(anchorEl),
              onMouseLeave: handleClose,
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {user?.username || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email || 'user@example.com'}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Box>
  );
};

export default PageHeader;
