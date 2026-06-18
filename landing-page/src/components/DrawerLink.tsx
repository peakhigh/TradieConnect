import * as React from 'react';
import Link from '@mui/material/Link';
import Drawer from '@mui/material/Drawer';
import { getContent, getTitle } from '@/ContentMap';
import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';

interface DrawerLinkProps {
  name: string;
  title?: string;
  color?: string;
}

export default function DrawerLink({ name, title, color }: DrawerLinkProps) {
  const [searchParams] = useSearchParams();
  const [page] = useState(searchParams.get('page') || undefined);
  const [showDrawer, setShowDrawer] = React.useState<boolean>(page === name);

  return (
    <>
      <Link
        color={color || 'text.secondary'}
        onClick={() => setShowDrawer(true)}
        style={{ cursor: 'pointer' }}
      >
        {title || getTitle(name)}
      </Link>
      {showDrawer && (
        <Drawer
          anchor={'right'}
          open={showDrawer}
          PaperProps={{ className: 'responsive-drawer' }}
          onClose={() => setShowDrawer(false)}
        >
          {getContent(name)}
        </Drawer>
      )}
    </>
  );
}
