import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import MoneyOffRoundedIcon from '@mui/icons-material/MoneyOffRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';

const items = [
  {
    icon: <MoneyOffRoundedIcon />,
    title: 'Free for customers',
    description: 'Post a job and receive quotes at no cost. You only ever deal directly with the tradies you choose.',
  },
  {
    icon: <BoltRoundedIcon />,
    title: 'Pay only for real leads',
    description: 'Tradies unlock a job for just 50c, so you spend credits only on the work you actually want.',
  },
  {
    icon: <VerifiedRoundedIcon />,
    title: 'Licensed local pros',
    description: 'Connect with tradespeople in your area and review their ratings before you hire.',
  },
  {
    icon: <LocationOnRoundedIcon />,
    title: 'Local matching',
    description: 'Jobs are matched to nearby tradies so quotes come from people who can actually show up.',
  },
  {
    icon: <StarRoundedIcon />,
    title: 'Ratings you can trust',
    description: 'Every completed job can be rated, building a reputation that helps good tradies stand out.',
  },
  {
    icon: <DevicesRoundedIcon />,
    title: 'Works everywhere',
    description: 'One experience across iOS, Android and the web, so you can manage jobs from any device.',
  },
];

export default function Highlights() {
  return (
    <Box id="highlights" sx={{ pt: { xs: 4, sm: 12 }, pb: { xs: 8, sm: 16 }, color: 'white', backgroundColor: '#06090a' }}>
      <Container sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: 3, sm: 6 } }}>
        <Box sx={{ width: { sm: '100%', md: '60%' }, textAlign: { sm: 'left', md: 'center' } }}>
          <Typography component="h2" variant="h4">
            Why TradieConnect
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.400' }}>
            A fair marketplace built for Australian customers and tradies, with
            transparent pricing and trusted local matches.
          </Typography>
        </Box>
        <Grid container spacing={2.5}>
          {items.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Stack
                direction="column"
                color="inherit"
                component={Card}
                spacing={1}
                useFlexGap
                sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'grey.800', background: 'transparent', backgroundColor: 'grey.900' }}
              >
                <Box sx={{ opacity: '50%' }}>{item.icon}</Box>
                <div>
                  <Typography fontWeight="medium" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                    {item.description}
                  </Typography>
                </div>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
