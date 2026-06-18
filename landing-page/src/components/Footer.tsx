import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import HandymanRoundedIcon from '@mui/icons-material/HandymanRounded';
import FacebookIcon from '@mui/icons-material/Facebook';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/X';
import DrawerLink from '@/components/DrawerLink';

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" mt={1}>
      {'Copyright © '}
      <Link href="/">TradieConnect&nbsp;</Link>
      {new Date().getFullYear()}
    </Typography>
  );
}

export default function Footer() {
  return (
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: { xs: 4, sm: 8 },
        py: { xs: 8, sm: 10 },
        textAlign: { sm: 'center', md: 'left' },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, width: '100%', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: { xs: '100%', sm: '60%' } }}>
          <Box sx={{ width: { xs: '100%', sm: '60%' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' }, mb: 2 }}>
              <HandymanRoundedIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                TradieConnect
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Newsletter
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Subscribe for tips, tradie spotlights and product updates.
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap>
              <TextField
                hiddenLabel
                size="small"
                variant="outlined"
                fullWidth
                placeholder="Your email address"
                inputProps={{ autoComplete: 'off', 'aria-label': 'Enter your email address' }}
              />
              <Button variant="contained" color="primary" sx={{ flexShrink: 0 }}>
                Subscribe
              </Button>
            </Stack>
          </Box>
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            Product
          </Typography>
          <Link color="text.secondary" href="#features">How it works</Link>
          <Link color="text.secondary" href="#highlights">Why us</Link>
          <Link color="text.secondary" href="#pricing">Pricing</Link>
          <Link color="text.secondary" href="#faq">FAQ</Link>
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            Company
          </Typography>
          <DrawerLink name={'about'} />
          <DrawerLink name={'contact'} title={'Contact'} />
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            Legal
          </Typography>
          <DrawerLink name={'terms'} title={'Terms'} />
          <DrawerLink name={'privacy'} title={'Privacy'} />
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'column', md: 'row' },
          justifyContent: 'space-between',
          pt: { xs: 4, sm: 8 },
          width: '100%',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <div>
          <DrawerLink name={'privacy'} />
          <Typography display="inline" sx={{ mx: 0.5, opacity: 0.5 }}>
            &nbsp;•&nbsp;
          </Typography>
          <DrawerLink name={'terms'} />
          <Copyright />
        </div>
        <Stack
          direction="row"
          justifyContent="left"
          spacing={1}
          useFlexGap
          sx={{ color: 'text.secondary', margin: { xs: '5px 0 0 -10px', md: 0 } }}
        >
          <IconButton color="inherit" href={import.meta.env.VITE_FACEBOOK_URL} aria-label="Facebook" sx={{ alignSelf: 'center' }}>
            <FacebookIcon />
          </IconButton>
          <IconButton color="inherit" href={import.meta.env.VITE_X_URL} aria-label="X" sx={{ alignSelf: 'center' }}>
            <TwitterIcon />
          </IconButton>
          <IconButton color="inherit" href={import.meta.env.VITE_LINKEDIN_URL} aria-label="LinkedIn" sx={{ alignSelf: 'center' }}>
            <LinkedInIcon />
          </IconButton>
        </Stack>
      </Box>
    </Container>
  );
}
