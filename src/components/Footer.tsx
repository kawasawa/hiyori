import { AppBar, colors, Link, Typography } from '@mui/material';
import React from 'react';

import { constants } from '../constants';

export const Footer = () => {
  return (
    <AppBar sx={{ position: 'static', display: 'block', padding: 2 }}>
      <Typography variant="body2" sx={{ color: colors.grey[500], textAlign: 'center' }} gutterBottom>
        {'Source: '}
        <Link href={constants.url.openWeatherMap} target="_blank" color="inherit" underline="always">
          OpenWeatherMap
        </Link>
        {', '}
        <Link href={constants.url.pixabay} target="_blank" color="inherit" underline="always">
          Pixabay
        </Link>
        {', '}
        <Link href={constants.url.flaticon} target="_blank" color="inherit" underline="always">
          Flaticon
        </Link>
      </Typography>
      <Typography variant="body2" sx={{ color: colors.grey[500], textAlign: 'center' }}>
        {'© '}
        <Link href={constants.url.homepage} target="_blank" color="inherit" underline="always">
          {constants.meta.author}
        </Link>
        {' All Rights Reserved.'}
      </Typography>
    </AppBar>
  );
};
