import { Box, Container, experimental_sx, Fade, styled, Typography } from '@mui/material';
import jaLocale from 'apexcharts/dist/locales/ja.json';
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';

import imageCloudy from '../assets/cloudy.webp';
import imageFewCloudy from '../assets/few-cloudy.webp';
import imageFoggy from '../assets/foggy.webp';
import imageRainy from '../assets/rainy.webp';
import imageSnowy from '../assets/snowy.webp';
import imageStormy from '../assets/stormy.webp';
import imageSunny from '../assets/sunny.webp';
import { useWeatherForecast } from '../hooks';
import { Coordinate } from '../hooks/useWeatherForecast';

const Area = styled(Box)(
  experimental_sx({
    display: 'flex',
    alignItems: 'center',
    height: '100vh',
  })
);

const Image = styled(Box)(
  experimental_sx({
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
  })
);

const HeaderText = styled(Box)(
  experimental_sx({
    mb: 8,
    p: { xs: 2, sm: 4 },
  })
);

// eslint-disable-next-line complexity
export const Banner = () => {
  const [coord, setCoord] = useState<Coordinate>({ lat: 35.69, lon: 139.69 });
  const weather = useWeatherForecast(coord);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCoord({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    });
  }, [setCoord]);

  if (!weather) return <div />;

  return (
    <Fade in={true} timeout={1500}>
      <Area>
        <Image
          sx={{
            backgroundImage: () => {
              switch (weather.forecasts[0]?.group) {
                case 'Thunderstorm':
                  return `url(${imageStormy})`;
                case 'Drizzle':
                  return `url(${imageRainy})`;
                case 'Rain':
                  return `url(${imageRainy})`;
                case 'Snow':
                  return `url(${imageSnowy})`;
                case 'Atmosphere':
                  return `url(${imageFoggy})`;
                case 'Clear':
                  return `url(${imageSunny})`;
                case 'Clouds':
                  return `url(${imageCloudy})`;
                case 'FewClouds':
                  return `url(${imageFewCloudy})`;
                default:
                  return `url(${imageSunny})`;
              }
            },
          }}
        />
        <Container sx={{ color: 'common.white', zIndex: 1 }}>
          <HeaderText sx={{ bgcolor: '#111d', borderRadius: 2, boxShadow: 1 }}>
            <Typography sx={{ fontSize: 32, fontWeight: 'bold' }}>
              {weather.city},{weather.forecasts[0]?.description},{weather.forecasts[0]?.temperature}°,
              {weather.forecasts[0]?.wind}m/s,
            </Typography>
          </HeaderText>
          <Chart
            series={[{ data: weather.forecasts.map((f) => [f.date, f.temperature]) }] as ApexAxisChartSeries}
            height="100%"
            options={{
              chart: {
                id: 'temperature-chart',
                group: 'chart-group',
                height: '100%',
                locales: [jaLocale],
                defaultLocale: 'ja',
                zoom: { enabled: false },
                animations: {
                  easing: 'easeinout',
                  animateGradually: { enabled: false },
                  dynamicAnimation: { speed: 100 },
                },
              },
              xaxis: {
                type: 'datetime',
                labels: { format: 'MM/dd' },
              },
              yaxis: {
                labels: { formatter: (val) => `${val.toFixed(0)}°` },
              },
              tooltip: {
                x: { format: 'yyyy/MM/dd HH:mm' },
                y: { formatter: (val) => `${val.toFixed(1)}°` },
              },
              legend: {
                position: 'top',
                horizontalAlign: 'left',
              },
            }}
          />
        </Container>
      </Area>
    </Fade>
  );
};
