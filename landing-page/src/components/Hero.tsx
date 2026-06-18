import * as React from 'react';
import { alpha } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PhoneDemo from './PhoneDemo';

export default function Hero() {
  const appUrl = import.meta.env.VITE_APP_URL;

  return (
    <Box
      id="hero"
      sx={(theme) => ({
        width: '100%',
        backgroundImage:
          theme.palette.mode === 'light'
            ? 'linear-gradient(180deg, #FFEDD5, #FFF)'
            : `linear-gradient(#7C2D12, ${alpha('#090E10', 0.0)})`,
        backgroundSize: '100% 30%',
        backgroundRepeat: 'no-repeat',
      })}
    >
      <Container
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pt: { xs: 18, sm: 22, md: 18 },
          pb: { xs: 8, sm: 12 },
        }}
      >
        <Stack spacing={2} useFlexGap sx={{ width: { xs: '100%', sm: '80%' }, alignItems: 'center' }}>
          <Typography
            variant="h1"
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignSelf: 'center',
              textAlign: 'center',
              fontSize: 'clamp(2.6rem, 8vw, 3.6rem)',
            }}
          >
            Find trusted local tradies,&nbsp;
            <Typography
              component="span"
              variant="h1"
              sx={{
                fontSize: 'clamp(2.6rem, 8vw, 3.6rem)',
                color: (theme) =>
                  theme.palette.mode === 'light' ? 'primary.main' : 'primary.light',
              }}
            >
              fast
            </Typography>
          </Typography>
          <Typography
            textAlign="center"
            color="text.secondary"
            sx={{ alignSelf: 'center', width: { sm: '100%', md: '80%' } }}
          >
            Post your job for free and get quotes from licensed local
            tradespeople. Compare quotes, pick the right pro, and get the job
            done. Tradies pay just 50c to unlock a lead, with a $10 signup bonus
            to get started.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignSelf="center"
            spacing={1}
            useFlexGap
            sx={{ pt: 2, width: { xs: '100%', sm: 'auto' } }}
          >
            <Button variant="contained" color="primary" component="a" href={`${appUrl}/signup`}>
              Post a job free
            </Button>
            <Button variant="outlined" color="primary" component="a" href={`${appUrl}/signup`}>
              Join as a tradie
            </Button>
          </Stack>
        </Stack>
        <Box
          sx={{
            mt: { xs: 10, sm: 12 },
            alignSelf: 'center',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <PhoneDemo />
        </Box>
      </Container>
    </Box>
  );
}
