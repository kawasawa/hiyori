import { Box } from '@mui/material';
import React from 'react';

import { Footer, WeatherForecast } from '../components';

export const Top = () => {
  return (
    <Box sx={{ color: 'common.white', bgcolor: 'grey.900' }}>
      <WeatherForecast />
      <Footer />
    </Box>
  );
};
