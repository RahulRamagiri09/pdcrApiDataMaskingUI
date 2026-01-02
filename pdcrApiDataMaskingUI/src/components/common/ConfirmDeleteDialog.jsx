import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
} from '@mui/material';

const ConfirmDeleteDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Delete',
  itemType = 'item',
  itemName = '',
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete the {itemType}{' '}
          <strong>"{itemName}"</strong>?
          <br />
          <br />
          This action cannot be undone and will permanently remove this{' '}
          {itemType} from the system.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
