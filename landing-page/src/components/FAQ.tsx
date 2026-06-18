import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const faqs = [
  {
    q: 'How much does it cost customers?',
    a: 'Nothing. Posting a job and receiving quotes is completely free for customers. You only deal directly with the tradies you choose.',
  },
  {
    q: 'How does pricing work for tradies?',
    a: 'Browsing jobs is free. When you find a job you want, you unlock the full details for just 50c from your prepaid wallet. New tradies get a $10 signup bonus to start.',
  },
  {
    q: 'Do I need a subscription?',
    a: 'No. TradieConnect is pay-as-you-go. Top up your wallet from as little as $5 and spend credits only on the leads you want.',
  },
  {
    q: 'When are contact details shared?',
    a: 'To protect both sides, a customer\u2019s address and phone number are shared with a tradie only after the customer accepts that tradie\u2019s quote.',
  },
  {
    q: 'Can I use it on my phone and computer?',
    a: 'Yes. TradieConnect runs on iOS, Android and the web from a single account, so you can manage jobs and quotes from any device.',
  },
];

export default function FAQ() {
  const [expanded, setExpanded] = React.useState<string | false>(false);

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Container
      id="faq"
      sx={{ pt: { xs: 4, sm: 12 }, pb: { xs: 8, sm: 16 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: 3, sm: 6 } }}
    >
      <Typography
        component="h2"
        variant="h4"
        color="text.primary"
        sx={{ width: { sm: '100%', md: '60%' }, textAlign: { sm: 'left', md: 'center' } }}
      >
        Frequently asked questions
      </Typography>
      <Box sx={{ width: '100%' }}>
        {faqs.map((faq, i) => (
          <Accordion key={i} expanded={expanded === `panel${i}`} onChange={handleChange(`panel${i}`)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`panel${i}d-content`} id={`panel${i}d-header`}>
              <Typography component="h3" variant="subtitle2">
                {faq.q}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" gutterBottom sx={{ maxWidth: { sm: '100%', md: '70%' } }}>
                {faq.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
}
