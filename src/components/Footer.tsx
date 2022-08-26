import { AppBar, colors, Link, Typography } from '@mui/material';
import React from 'react';

import { constants } from '../constants';

export const Footer = () => {
  return (
    <AppBar sx={{ position: 'static', display: 'block', padding: 2 }}>
      <Typography variant="body2" sx={{ color: colors.grey[500], textAlign: 'center' }}>
        {'© '}
        <Link href={constants.url.homepage} target="_blank" underline="always" sx={{ color: colors.grey[500] }}>
          {constants.meta.author}
        </Link>
        {' All Rights Reserved.'}
      </Typography>
    </AppBar>
  );
};
