import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const ContactUs = () => {
  return (
    <div className="legal-content">
      <h2>Contact us</h2>
      <Box sx={{ width: { xs: '100%', sm: '90%' } }}>
        <Typography variant="h5" color="text.primary" mb={1} mt={2}>
          TradieConnect
        </Typography>
        <Typography variant="body2" color="text.primary" mb={1} fontWeight={400} fontSize={18}>
          <span style={{ color: '#EA580C' }}>Email</span>:{' '}
          <a href="mailto:hello@tradieconnect.app" style={{ color: '#EA580C' }}>
            hello@tradieconnect.app
          </a>
        </Typography>
        <Typography variant="h5" color="text.primary" mb={2} mt={2}>
          OR
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Submit your details and we will get back to you
        </Typography>
        <Stack direction="column" spacing={2} useFlexGap>
          <TextField
            hiddenLabel
            size="small"
            variant="outlined"
            fullWidth
            placeholder="Your email address"
            inputProps={{ autoComplete: 'off', 'aria-label': 'Enter your email address' }}
          />
          <TextField
            hiddenLabel
            size="small"
            variant="outlined"
            multiline
            rows={4}
            fullWidth
            placeholder="Your enquiry information"
            inputProps={{ autoComplete: 'off', 'aria-label': 'What you want to enquire about?' }}
          />
          <Button variant="contained" color="primary" sx={{ flexShrink: 0, width: '200px', alignSelf: 'flex-end' }}>
            Submit
          </Button>
        </Stack>
      </Box>
    </div>
  );
};

export default ContactUs;
