import { Box } from '@mui/material';
import React from 'react';

import { Banner } from '../components';

export const Top = () => {
  return (
    <Box sx={{ color: 'common.white', bgcolor: 'grey.900' }}>
      <Banner />
    </Box>
  );
};
