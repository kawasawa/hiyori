import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';

import { colors, createTheme, ThemeProvider } from '@mui/material';
import i18n from 'i18next';
import React from 'react';
import { initReactI18next } from 'react-i18next';
import { ToastContainer } from 'react-toastify';

import jaJson from './locales/ja.json';
import { Top } from './pages';

i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: jaJson },
  },
  lng: 'ja',
  fallbackLng: 'ja',
});

const AppTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: colors.grey[900] },
  },
  typography: {
    button: {
      textTransform: 'none',
    },
  },
});

const App = () => (
  <ThemeProvider theme={AppTheme}>
    <Top />
    <ToastContainer draggable={false} closeButton={false} autoClose={5000} />
  </ThemeProvider>
);

export default App;
