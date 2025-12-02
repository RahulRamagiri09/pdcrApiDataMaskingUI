import React from 'react';
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
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Storage as StorageIcon,
  AccountTree as WorkflowIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useSidebar } from '../../context/SidebarContext';
import { isAdmin } from '../../utils/rbac';

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
  const userIsAdmin = isAdmin();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
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
        <Tooltip
          title={item.text}
          placement="right"
          arrow
          key={item.path}
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: 'white',
                color: '#0b2677',
                boxShadow: '0px 5px 15px rgba(0,0,0,0.2)',
                fontSize: '0.875rem',
                fontWeight: 500,
                py: 1,
                px: 2,
                minWidth: 100,
                '& .MuiTooltip-arrow': {
                  color: 'white',
                },
              },
            },
          }}
        >
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
        onClick={() => handleNavigation('/server/dashboard')}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 1.5,
          minHeight: 56,
          backgroundColor: '#0b2677',
          color: 'white',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: '#0a1f5e',
          },
        }}
      >
        {isExpanded ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img
              src="/logo192.png"
              alt="Logo"
              style={{ height: '32px', width: '32px' }}
            />
            {/* <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              PII Masking Tool
            </Typography> */}
          </Box>
        ) : (
          <img
            src="/logo192.png"
            alt="Logo"
            style={{ height: '32px', width: '32px' }}
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
          {userIsAdmin && adminItems.map((item) => (
            <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
              {renderNavItem(item)}
            </ListItem>
          ))}
        </List>
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
