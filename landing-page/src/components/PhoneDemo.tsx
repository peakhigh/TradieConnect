import * as React from 'react';
import { alpha } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import PlumbingRoundedIcon from '@mui/icons-material/PlumbingRounded';
import ElectricalServicesRoundedIcon from '@mui/icons-material/ElectricalServicesRounded';
import FormatPaintRoundedIcon from '@mui/icons-material/FormatPaintRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';

type TabKey = 'home' | 'jobs' | 'wallet';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'home', label: 'Home', icon: <HomeRoundedIcon sx={{ fontSize: 22 }} /> },
  { key: 'jobs', label: 'Jobs', icon: <WorkRoundedIcon sx={{ fontSize: 22 }} /> },
  { key: 'wallet', label: 'Wallet', icon: <AccountBalanceWalletRoundedIcon sx={{ fontSize: 22 }} /> },
];

function StatCard({ icon, value, label, accent }: { icon: React.ReactNode; value: string; label: string; accent: string }) {
  return (
    <Box
      sx={{
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: '14px',
        border: '1px solid #EEF1F5',
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
      }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: alpha(accent, 0.12),
          color: accent,
        }}
      >
        {icon}
      </Box>
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#131B20', lineHeight: 1.1 }}>{value}</Typography>
      <Typography sx={{ fontSize: 12, color: '#5B6B7C' }}>{label}</Typography>
    </Box>
  );
}

function HomeScreen() {
  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box>
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#131B20' }}>
          Hey Dave <Box component="span" sx={{ fontSize: 11, fontWeight: 700, color: 'primary.main', backgroundColor: (t) => alpha(t.palette.primary.main, 0.12), px: 0.8, py: 0.3, borderRadius: '6px', ml: 0.5 }}>TRADIE</Box>
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#94A6B8' }}>Friday, 19 Jun 2026 · Sydney NSW</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1.2 }}>
        <StatCard icon={<WorkRoundedIcon sx={{ fontSize: 18 }} />} value="8" label="New leads" accent="#F97316" />
        <StatCard icon={<RequestQuoteRoundedIcon sx={{ fontSize: 18 }} />} value="3" label="Quotes sent" accent="#06B6D4" />
      </Box>
      <Box sx={{ display: 'flex', gap: 1.2 }}>
        <StatCard icon={<AccountBalanceWalletRoundedIcon sx={{ fontSize: 18 }} />} value="$12.50" label="Wallet" accent="#22C55E" />
        <StatCard icon={<StarRoundedIcon sx={{ fontSize: 18 }} />} value="4.9" label="Rating" accent="#8B5CF6" />
      </Box>
      <Box sx={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #EEF1F5', p: 1.5, mt: 0.5 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#131B20', mb: 1 }}>Nearest job</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: (t) => alpha(t.palette.primary.main, 0.12), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlumbingRoundedIcon />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#131B20' }}>Leaking kitchen tap</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.3 }}>
              <LocationOnRoundedIcon sx={{ fontSize: 13, color: '#94A6B8' }} />
              <Typography sx={{ fontSize: 11, color: '#94A6B8' }}>2.3 km · Parramatta</Typography>
            </Box>
          </Box>
          <Box sx={{ backgroundColor: (t) => alpha(t.palette.primary.main, 0.12), color: 'primary.main', px: 1, py: 0.5, borderRadius: '8px', fontSize: 11, fontWeight: 700 }}>50c</Box>
        </Box>
      </Box>
    </Box>
  );
}

function JobsScreen() {
  const jobs = [
    { name: 'Leaking kitchen tap', loc: '2.3 km · Parramatta', icon: <PlumbingRoundedIcon sx={{ fontSize: 20 }} />, color: '#06B6D4', tag: 'Plumbing' },
    { name: 'Install ceiling fans x3', loc: '4.1 km · Blacktown', icon: <ElectricalServicesRoundedIcon sx={{ fontSize: 20 }} />, color: '#F97316', tag: 'Electrical' },
    { name: 'Repaint living room', loc: '6.8 km · Castle Hill', icon: <FormatPaintRoundedIcon sx={{ fontSize: 20 }} />, color: '#8B5CF6', tag: 'Painting' },
  ];
  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.3 }}>
      <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#131B20' }}>Jobs near you</Typography>
      {jobs.map((j) => (
        <Box key={j.name} sx={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #EEF1F5', p: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '10px', backgroundColor: alpha(j.color, 0.12), color: j.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {j.icon}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#131B20' }}>{j.name}</Typography>
              <Typography sx={{ fontSize: 11, color: '#94A6B8' }}>{j.loc}</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: 'primary.main', fontSize: 11, fontWeight: 700 }}>
                <LockOpenRoundedIcon sx={{ fontSize: 13 }} /> 50c
              </Box>
              <Typography sx={{ fontSize: 10, color: alpha(j.color, 1), backgroundColor: alpha(j.color, 0.12), px: 0.7, py: 0.2, borderRadius: '6px', fontWeight: 600 }}>{j.tag}</Typography>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function WalletScreen() {
  const txns = [
    { label: 'Signup bonus', amt: '+$10.00', pos: true },
    { label: 'Unlock · Kitchen tap', amt: '-$0.50', pos: false },
    { label: 'Top up', amt: '+$5.00', pos: true },
    { label: 'Unlock · Ceiling fans', amt: '-$0.50', pos: false },
    { label: 'Unlock · Deck repair', amt: '-$0.50', pos: false },
  ];
  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#131B20' }}>Wallet</Typography>
      <Box sx={{ borderRadius: '16px', p: 2, background: (t) => `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.primary.dark})`, color: '#fff' }}>
        <Typography sx={{ fontSize: 12, opacity: 0.85 }}>Available balance</Typography>
        <Typography sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.3 }}>$12.50</Typography>
        <Typography sx={{ fontSize: 11, opacity: 0.85 }}>= 25 lead unlocks</Typography>
      </Box>
      <Box sx={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #EEF1F5', p: 1.5 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#131B20', mb: 1 }}>Recent activity</Typography>
        {txns.map((t, i) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.6, borderTop: i === 0 ? 'none' : '1px solid #F4F6FA' }}>
            <Typography sx={{ fontSize: 12, color: '#5B6B7C' }}>{t.label}</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: t.pos ? '#22C55E' : '#EA580C' }}>{t.amt}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

const SCREENS: Record<TabKey, React.ReactNode> = {
  home: <HomeScreen />,
  jobs: <JobsScreen />,
  wallet: <WalletScreen />,
};

const TITLES: Record<TabKey, string> = {
  home: 'Dashboard',
  jobs: 'Find Jobs',
  wallet: 'Wallet',
};
export default function PhoneDemo() {
  const [tab, setTab] = React.useState<TabKey>('home');

  return (
    <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
      {/* Live demo pill */}
      <Box
        sx={{
          position: 'absolute',
          top: -18,
          right: { xs: '50%', md: '12%' },
          transform: { xs: 'translateX(50%)', md: 'none' },
          zIndex: 3,
          backgroundColor: '#0B1220',
          color: '#fff',
          borderRadius: '999px',
          px: 2,
          py: 0.8,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        }}
      >
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F97316' }} />
        <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, fontFamily: 'monospace' }}>
          LIVE DEMO · TAP AROUND
        </Typography>
      </Box>

      {/* Phone frame */}
      <Box
        sx={{
          width: 300,
          maxWidth: '88vw',
          height: 600,
          backgroundColor: '#0B1220',
          borderRadius: '44px',
          p: '12px',
          boxShadow: '0 30px 60px -20px rgba(15, 23, 42, 0.45)',
          position: 'relative',
        }}
      >
        {/* Screen */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: '#F4F6FA',
            borderRadius: '34px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Notch */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 110,
              height: 22,
              backgroundColor: '#0B1220',
              borderRadius: '999px',
              zIndex: 4,
            }}
          />
          {/* Status bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2.5, pt: 1.4, pb: 0.5 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#131B20' }}>12:10</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, color: '#131B20', fontSize: 11 }}>▮▮▮ ▾ ▰</Box>
          </Box>
          {/* App header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.2, backgroundColor: '#fff', borderBottom: '1px solid #EEF1F5' }}>
            <MenuRoundedIcon sx={{ color: 'primary.main' }} />
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#131B20', flex: 1, textAlign: 'center', mr: 3 }}>
              {TITLES[tab]}
            </Typography>
          </Box>
          {/* Scrollable content */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>{SCREENS[tab]}</Box>
          {/* Bottom tab bar */}
          <Box sx={{ display: 'flex', borderTop: '1px solid #EEF1F5', backgroundColor: '#fff', pb: 1.2, pt: 0.8 }}>
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <Box
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.3,
                    cursor: 'pointer',
                    color: active ? 'primary.main' : '#94A6B8',
                    transition: 'color 0.15s ease',
                  }}
                >
                  {t.icon}
                  <Typography sx={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{t.label}</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
