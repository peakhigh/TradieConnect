import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PostAddRoundedIcon from '@mui/icons-material/PostAddRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import ChatRoundedIcon from '@mui/icons-material/ChatRounded';

const items = [
  {
    icon: <PostAddRoundedIcon />,
    title: 'Post a job for free',
    description:
      'Customers describe what they need in a couple of minutes. There is no cost to post a request or to receive quotes from local tradies.',
  },
  {
    icon: <LockOpenRoundedIcon />,
    title: 'Pay-per-lead for tradies',
    description:
      'Tradies browse a feed of nearby jobs and unlock the full details of the ones they want for just 50c, funded from a simple prepaid wallet.',
  },
  {
    icon: <ChatRoundedIcon />,
    title: 'Quote, chat & get hired',
    description:
      'Submit a quote, message the customer in-app, and once you are accepted, contact details are shared so you can get the job done.',
  },
];

export default function Features() {
  const [selectedItemIndex, setSelectedItemIndex] = React.useState(0);
  const handleItemClick = (index: number) => setSelectedItemIndex(index);
  const selectedFeature = items[selectedItemIndex];

  return (
    <Container id="features" sx={{ py: { xs: 8, sm: 16 } }}>
      <Grid container spacing={6}>
        <Grid item xs={12} md={6}>
          <Box>
            <Typography component="h2" variant="h4" color="text.primary">
              How it works
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: { xs: 2, sm: 4 } }}>
              A simple marketplace that works for both customers and tradies.
            </Typography>
          </Box>
          <Grid container item gap={1} sx={{ display: { xs: 'auto', sm: 'none' } }}>
            {items.map(({ title }, index) => (
              <Chip
                key={index}
                label={title}
                onClick={() => handleItemClick(index)}
                sx={{
                  backgroundColor: selectedItemIndex === index ? 'primary.main' : '',
                  '& .MuiChip-label': { color: selectedItemIndex === index ? '#fff' : '' },
                }}
              />
            ))}
          </Grid>
          <Box component={Card} variant="outlined" sx={{ display: { xs: 'auto', sm: 'none' }, mt: 4 }}>
            <Box sx={{ px: 2, py: 2 }}>
              <Typography color="text.primary" variant="body2" fontWeight="bold">
                {selectedFeature.title}
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ my: 0.5 }}>
                {selectedFeature.description}
              </Typography>
            </Box>
          </Box>
          <Stack
            direction="column"
            justifyContent="center"
            alignItems="flex-start"
            spacing={2}
            useFlexGap
            sx={{ width: '100%', display: { xs: 'none', sm: 'flex' } }}
          >
            {items.map(({ icon, title, description }, index) => (
              <Card
                key={index}
                variant="outlined"
                component={Button}
                onClick={() => handleItemClick(index)}
                sx={{
                  p: 3,
                  height: 'fit-content',
                  width: '100%',
                  background: 'none',
                  backgroundColor: selectedItemIndex === index ? 'action.selected' : undefined,
                  borderColor: (theme) =>
                    selectedItemIndex === index ? 'primary.light' : 'grey.200',
                }}
              >
                <Box sx={{ width: '100%', display: 'flex', textAlign: 'left', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, gap: 2.5 }}>
                  <Box sx={{ color: (theme) => (selectedItemIndex === index ? 'primary.main' : 'grey.400') }}>
                    {icon}
                  </Box>
                  <Box sx={{ textTransform: 'none' }}>
                    <Typography color="text.primary" variant="body2" fontWeight="bold">
                      {title}
                    </Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ my: 0.5 }}>
                      {description}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            ))}
          </Stack>
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: { xs: 'none', sm: 'flex' }, width: '100%' }}>
          <Card variant="outlined" sx={{ height: '100%', width: '100%', display: { xs: 'none', sm: 'flex' }, pointerEvents: 'none' }}>
            <Box
              sx={(theme) => ({
                m: 'auto',
                width: '100%',
                height: 460,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.light}22, ${theme.palette.primary.main}11)`,
              })}
            >
              <Box sx={{ color: 'primary.main', '& svg': { fontSize: 96 } }}>
                {selectedFeature.icon}
              </Box>
              <Typography variant="h5" color="primary.main" fontWeight={600}>
                {selectedFeature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ px: 6, textAlign: 'center' }}>
                {selectedFeature.description}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
