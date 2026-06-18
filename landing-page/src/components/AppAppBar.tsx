import * as React from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import HandymanRoundedIcon from '@mui/icons-material/HandymanRounded';

function Logo() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, mr: 2 }}>
      <HandymanRoundedIcon sx={{ color: 'primary.main' }} />
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
        TradieConnect
      </Typography>
    </Box>
  );
}

export default function AppAppBar() {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (newOpen: boolean) => () => setOpen(newOpen);

  const scrollToSection = (sectionId: string) => {
    const sectionElement = document.getElementById(sectionId);
    const offset = 128;
    if (sectionElement) {
      const targetScroll = sectionElement.offsetTop - offset;
      sectionElement.scrollIntoView({ behavior: 'smooth' });
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      setOpen(false);
    }
  };

  const appUrl = import.meta.env.VITE_APP_URL;

  return (
    <div>
      <AppBar
        position="fixed"
        sx={{ boxShadow: 0, backgroundColor: 'transparent', backgroundImage: 'none', mt: 2 }}
      >
        <Container maxWidth="lg">
          <Toolbar
            variant="regular"
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              borderRadius: '999px',
              backgroundColor:
                theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.4)'
                  : 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(24px)',
              maxHeight: 40,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow:
                theme.palette.mode === 'light'
                  ? `0 0 1px rgba(249, 115, 22, 0.1), 1px 1.5px 2px -1px rgba(249, 115, 22, 0.15), 4px 4px 12px -2.5px rgba(249, 115, 22, 0.15)`
                  : '0 0 1px rgba(122, 45, 18, 0.7), 1px 1.5px 2px -1px rgba(122, 45, 18, 0.65), 4px 4px 12px -2.5px rgba(122, 45, 18, 0.65)',
            })}
          >
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', px: 0 }}>
              <Logo />
              <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                <MenuItem onClick={() => scrollToSection('features')} sx={{ py: '6px', px: '12px' }}>
                  <Typography variant="body2" color="text.primary">How it works</Typography>
                </MenuItem>
                <MenuItem onClick={() => scrollToSection('highlights')} sx={{ py: '6px', px: '12px' }}>
                  <Typography variant="body2" color="text.primary">Why us</Typography>
                </MenuItem>
                <MenuItem onClick={() => scrollToSection('pricing')} sx={{ py: '6px', px: '12px' }}>
                  <Typography variant="body2" color="text.primary">Pricing</Typography>
                </MenuItem>
                <MenuItem onClick={() => scrollToSection('faq')} sx={{ py: '6px', px: '12px' }}>
                  <Typography variant="body2" color="text.primary">FAQ</Typography>
                </MenuItem>
              </Box>
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, alignItems: 'center' }}>
              <Button color="primary" variant="text" size="small" component="a" href={`${appUrl}/login`}>
                Sign in
              </Button>
              <Button color="primary" variant="contained" size="small" component="a" href={`${appUrl}/signup`}>
                Sign up
              </Button>
            </Box>
            <Box sx={{ display: { sm: '', md: 'none' } }}>
              <Button variant="text" color="primary" aria-label="menu" onClick={toggleDrawer(true)} sx={{ minWidth: '30px', p: '4px' }}>
                <MenuIcon />
              </Button>
              <Drawer anchor="right" open={open} onClose={toggleDrawer(false)}>
                <Box sx={{ minWidth: '60dvw', p: 2, backgroundColor: 'background.paper', flexGrow: 1 }}>
                  <MenuItem onClick={() => scrollToSection('features')}>How it works</MenuItem>
                  <MenuItem onClick={() => scrollToSection('highlights')}>Why us</MenuItem>
                  <MenuItem onClick={() => scrollToSection('pricing')}>Pricing</MenuItem>
                  <MenuItem onClick={() => scrollToSection('faq')}>FAQ</MenuItem>
                  <Divider />
                  <MenuItem>
                    <Button color="primary" variant="contained" component="a" href={`${appUrl}/signup`} sx={{ width: '100%' }}>
                      Sign up
                    </Button>
                  </MenuItem>
                  <MenuItem>
                    <Button color="primary" variant="outlined" component="a" href={`${appUrl}/login`} sx={{ width: '100%' }}>
                      Sign in
                    </Button>
                  </MenuItem>
                </Box>
              </Drawer>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </div>
  );
}
