import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Tooltip,
  Box,
  Typography,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Storage as StorageIcon,
  AccountTree as WorkflowIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useSidebar } from '../../context/SidebarContext';
import { getCurrentUser } from '../../utils/auth';

const SIDEBAR_WIDTH_EXPANDED = 200;
const SIDEBAR_WIDTH_COLLAPSED = 64;

const navigationItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/server/dashboard',
    section: 'main',
  },
  {
    text: 'Connections',
    icon: <StorageIcon />,
    path: '/server/connections',
    section: 'main',
  },
  {
    text: 'Workflows',
    icon: <WorkflowIcon />,
    path: '/server/workflows',
    section: 'main',
  },
  {
    text: 'Register User',
    icon: <PersonAddIcon />,
    path: '/register-user',
    section: 'admin',
  },
  {
    text: 'Register Role',
    icon: <SecurityIcon />,
    path: '/register-role',
    section: 'admin',
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isExpanded, toggleSidebar } = useSidebar();
  const user = getCurrentUser();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

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

  const renderNavItem = (item) => {
    const active = isActive(item.path);

    const button = (
      <ListItemButton
        onClick={() => handleNavigation(item.path)}
        sx={{
          minHeight: 48,
          justifyContent: isExpanded ? 'initial' : 'center',
          px: 2.5,
          backgroundColor: active ? 'rgba(11, 38, 119, 0.08)' : 'transparent',
          borderLeft: active ? '4px solid #0b2677' : '4px solid transparent',
          '&:hover': {
            backgroundColor: 'rgba(11, 38, 119, 0.12)',
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: isExpanded ? 3 : 'auto',
            justifyContent: 'center',
            color: active ? '#0b2677' : 'inherit',
            fontSize: '1.25rem',
            '& svg': {
              fontSize: '1.25rem',
            },
          }}
        >
          {item.icon}
        </ListItemIcon>
        {isExpanded && (
          <ListItemText
            primary={item.text}
            sx={{
              opacity: 1,
              '& .MuiListItemText-primary': {
                fontWeight: active ? 600 : 400,
                color: active ? '#0b2677' : 'inherit',
              },
            }}
          />
        )}
      </ListItemButton>
    );

    if (!isExpanded) {
      return (
        <Tooltip title={item.text} placement="right" arrow key={item.path}>
          {button}
        </Tooltip>
      );
    }

    return button;
  };

  const mainItems = navigationItems.filter(item => item.section === 'main');
  const adminItems = navigationItems.filter(item => item.section === 'admin');

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
        flexShrink: 0,
        transition: 'width 0.3s ease',
        '& .MuiDrawer-paper': {
          width: isExpanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
          boxSizing: 'border-box',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Logo Section - Top */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          minHeight: 70,
          backgroundColor: '#0b2677',
          color: 'white',
        }}
      >
        {isExpanded ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <img
              src="/logo192.png"
              alt="Logo"
              style={{ height: '30px', width: '30px' }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
              PII Masking Tool
            </Typography>
          </Box>
        ) : (
          <img
            src="/logo192.png"
            alt="Logo"
            style={{ height: '28px', width: '28px' }}
          />
        )}
      </Box>

      {/* Main Navigation - Flexible grow area */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <List>
          {mainItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
              {renderNavItem(item)}
            </ListItem>
          ))}
          {adminItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
              {renderNavItem(item)}
            </ListItem>
          ))}
        </List>
      </Box>

      {/* User Profile Section - Bottom */}
      <Divider />
      <Box
        sx={{
          p: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        }}
      >
        {isExpanded ? (
          <Box
            onClick={handleMenu}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              p: 1,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            {user?.profilePicture ? (
              <Avatar
                alt={user.username}
                src={user.profilePicture}
                sx={{ width: 36, height: 36 }}
              />
            ) : (
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#0b2677' }}>
                <AccountCircleIcon />
              </Avatar>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, noWrap: true }}>
                {user?.username || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ noWrap: true }}>
                {user?.email || 'user@example.com'}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Tooltip title={`${user?.username || 'User'} - Click for menu`} placement="right" arrow>
            <IconButton
              onClick={handleMenu}
              sx={{
                width: '100%',
                height: 48,
                borderRadius: 1,
              }}
            >
              {user?.profilePicture ? (
                <Avatar
                  alt={user.username}
                  src={user.profilePicture}
                  sx={{ width: 36, height: 36 }}
                />
              ) : (
                <Avatar sx={{ width: 36, height: 36, bgcolor: '#0b2677' }}>
                  <AccountCircleIcon />
                </Avatar>
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* User Menu */}
        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'bottom',
            horizontal: isExpanded ? 'left' : 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      {/* Toggle Button - Bottom */}
      <Divider />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 1,
          minHeight: 56,
        }}
      >
        <IconButton
          onClick={toggleSidebar}
          sx={{
            color: '#0b2677',
            '&:hover': {
              backgroundColor: 'rgba(11, 38, 119, 0.08)',
            },
          }}
        >
          {isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
