import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

const appUrl = import.meta.env.VITE_APP_URL;

const tiers = [
  {
    title: 'Customers',
    price: '0',
    unit: 'always free',
    description: ['Post unlimited jobs', 'Receive quotes at no cost', 'Compare tradies and ratings', 'Only deal with pros you choose'],
    buttonText: 'Post a job free',
    buttonVariant: 'outlined',
    link: `${appUrl}/signup`,
  },
  {
    title: 'Tradie Starter',
    subheader: '$10 signup bonus',
    price: '0.50',
    unit: 'per lead unlocked',
    description: [
      '$10 free credit when you join',
      'Browse local jobs free',
      'Unlock a full job for just 50c',
      'Quote and message customers in-app',
    ],
    buttonText: 'Join as a tradie',
    buttonVariant: 'contained',
    selected: true,
    link: `${appUrl}/signup`,
  },
  {
    title: 'Wallet Top-up',
    price: '5',
    unit: 'minimum recharge',
    description: ['Top up your wallet from $5', 'Credits never expire', 'Spend only on leads you want'],
    buttonText: 'Get started',
    buttonVariant: 'outlined',
    link: `${appUrl}/signup`,
  },
];

export default function Pricing() {
  return (
    <Container
      id="pricing"
      sx={{ pt: { xs: 4, sm: 12 }, pb: { xs: 8, sm: 16 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: 3, sm: 6 } }}
    >
      <Box sx={{ width: { sm: '100%', md: '60%' }, textAlign: { sm: 'left', md: 'center' } }}>
        <Typography component="h2" variant="h4" color="text.primary">
          Simple, fair pricing
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Free for customers. Pay-as-you-go for tradies, with no subscriptions.
        </Typography>
      </Box>
      <Grid container spacing={3} alignItems="center" justifyContent="center">
        {tiers.map((tier) => (
          <Grid item key={tier.title} xs={12} sm={6} md={4}>
            <Card
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                border: tier.selected ? '1px solid' : undefined,
                borderColor: tier.selected ? 'primary.main' : undefined,
                background: tier.selected ? 'linear-gradient(#C2410C, #7C2D12)' : undefined,
              }}
            >
              <CardContent>
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: tier.selected ? 'grey.100' : '' }}>
                  <Typography component="h3" variant="h6">
                    {tier.title}
                  </Typography>
                  {tier.selected && (
                    <Chip
                      icon={<AutoAwesomeIcon />}
                      label={tier.subheader}
                      size="small"
                      sx={{
                        backgroundColor: 'primary.contrastText',
                        '& .MuiChip-label': { color: 'primary.dark' },
                        '& .MuiChip-icon': { color: 'primary.dark' },
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', color: tier.selected ? 'grey.50' : undefined }}>
                  <Typography component="h3" variant="h2">
                    ${tier.price}
                  </Typography>
                  <Typography component="h3" variant="h6">
                    &nbsp; {tier.unit}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2, opacity: 0.2, borderColor: 'grey.500' }} />
                {tier.description.map((line) => (
                  <Box key={line} sx={{ py: 1, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <CheckCircleRoundedIcon sx={{ width: 20, color: tier.selected ? 'primary.light' : 'primary.main' }} />
                    <Typography component="div" variant="subtitle2" sx={{ color: tier.selected ? 'grey.200' : undefined }}>
                      {line}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
              <CardActions>
                <Button fullWidth variant={tier.buttonVariant as 'outlined' | 'contained'} component="a" href={tier.link}>
                  {tier.buttonText}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
