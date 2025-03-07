import React, { useState } from 'react';
import { Fab, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { Chat as ChatIcon, Close as CloseIcon } from '@mui/icons-material';
import ChatBot from './ChatBot';

const FloatingChatButton = () => {
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    setOpen(!open);
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="chat"
        onClick={handleToggle}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1000,
        }}
      >
        <ChatIcon />
      </Fab>

      <Dialog
        open={open}
        onClose={handleToggle}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            position: 'fixed',
            bottom: '6rem',
            right: '2rem',
            margin: 0,
            maxHeight: '600px',
            width: '400px',
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Chat Assistant
          <IconButton
            aria-label="close"
            onClick={handleToggle}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <ChatBot />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingChatButton; 