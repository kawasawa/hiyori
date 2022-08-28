import './WeatherForecast.css';

import { MyLocation as MyLocationIcon } from '@mui/icons-material';
import {
  Box,
  Container,
  experimental_sx,
  Fade,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  styled,
  Tooltip,
  Typography,
} from '@mui/material';
import jaLocale from 'apexcharts/dist/locales/ja.json';
import Leaflet, { LatLng } from 'leaflet';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Chart from 'react-apexcharts';
import { useTranslation } from 'react-i18next';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import * as util from 'util';

import imageCloudy from '../assets/cloudy.webp';
import imageFewCloudy from '../assets/few-cloudy.webp';
import imageFoggy from '../assets/foggy.webp';
import imageRainy from '../assets/rainy.webp';
import imageSnowy from '../assets/snowy.webp';
import imageStormy from '../assets/stormy.webp';
import imageSunny from '../assets/sunny.webp';
import { handleError } from '../errors';
import { useWeatherForecast } from '../hooks';
import { groupBy } from '../utils/Array';

Leaflet.Icon.Default.imagePath = '//cdnjs.cloudflare.com/ajax/libs/leaflet/1.8.0/images/';

const Background = styled(Box)(
  experimental_sx({
    position: 'relative',
    minHeight: '100vh',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    backgroundAttachment: 'fixed',
  })
);

const DarkRoundBox = styled(Box)(
  experimental_sx({
    background: '#254F8FBB',
    borderRadius: 2,
    boxShadow: 1,
  })
);

// eslint-disable-next-line complexity
export const WeatherForecast = () => {
  const [t] = useTranslation();
  const [coord, setCoord] = useState<LatLng>(new LatLng(35.69, 139.69));
  const weather = useWeatherForecast(coord);

  const chartWeather = useMemo(() => weather && weather.forecasts.slice(0, 9), [weather]);
  const maxTemperature = useMemo(
    () => chartWeather && chartWeather.map((f) => f.temperature).reduce((_1, _2) => Math.max(_1, _2)) + 1,
    [chartWeather]
  );
  const minTemperature = useMemo(
    () => chartWeather && chartWeather.map((f) => f.temperature).reduce((_1, _2) => Math.min(_1, _2)) - 1,
    [chartWeather]
  );
  const maxHumidity = useMemo(
    () =>
      chartWeather &&
      Math.min(
        (Math.floor(chartWeather.map((f) => f.humidity).reduce((_1, _2) => Math.max(_1, _2)) / 10) + 1) * 10,
        100
      ),
    [chartWeather]
  );
  const minHumidity = useMemo(
    () =>
      chartWeather &&
      Math.max((Math.floor(chartWeather.map((f) => f.humidity).reduce((_1, _2) => Math.min(_1, _2)) / 10) - 1) * 10, 0),
    [chartWeather]
  );

  const groupWeather = useMemo(() => weather && groupBy(weather.forecasts, (f) => f.ymd), [weather]);

  const onClickGetCurrentPosition = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoord(new LatLng(position.coords.latitude, position.coords.longitude));
      },
      (error) => {
        handleError(error);
      }
    );
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      setCoord(new LatLng(position.coords.latitude, position.coords.longitude));
    });
  }, []);

  if (!weather)
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LinearProgress color="inherit" sx={{ width: '80%' }} />
      </Box>
    );

  return (
    <Fade in={true} timeout={1500}>
      <Background
        sx={{
          backgroundImage: () => {
            switch (weather.forecasts[0].group) {
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
      >
        <Container sx={{ pt: { xs: 4, sm: 12 }, pb: { xs: 4, sm: 12 } }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={7} order={0}>
              <DarkRoundBox sx={{ p: { xs: 1.5, sm: 4 } }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Typography sx={{ fontSize: 20, fontWeight: 'bold' }}>
                    {util.format(t('format.weatherForecast__cityWeather'), weather.city)}
                  </Typography>
                  <Tooltip title={t('command.getCurrentPosition')}>
                    <IconButton sx={{ background: '#254F8F88' }} onClick={onClickGetCurrentPosition}>
                      <MyLocationIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Typography sx={{ fontSize: 16 }}>{`${(weather.forecasts[0].date.getMonth() + 1)
                  .toString()
                  .padStart(2, '0')}/${weather.forecasts[0].date.getDate().toString().padStart(2, '0')}
                  ${weather.forecasts[0].date.getHours().toString().padStart(2, '0')}:${weather.forecasts[0].date
                  .getMinutes()
                  .toString()
                  .padStart(2, '0')}`}</Typography>
                <Grid container alignItems="center">
                  <Grid item sx={{ mx: 1 }}>
                    <Stack direction="row" alignItems="center">
                      <img src={util.format(weather.forecasts[0].iconUrl, '@2x')} />
                      <Typography sx={{ fontSize: 62 }}>{weather.forecasts[0].temperature}°</Typography>
                    </Stack>
                  </Grid>
                  <Grid item sx={{ mx: 1 }}>
                    <Stack>
                      <Typography sx={{ fontSize: 22, fontWeight: 'bold' }}>
                        {weather.forecasts[0].description}
                      </Typography>
                      <Typography sx={{ fontSize: 16 }}>
                        {t('label.weatherForecast__feelsLike')} {weather.forecasts[0].feelsLike}°
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
                <Grid container alignItems="center" sx={{ mt: 1 }}>
                  <Grid item sx={{ mx: 1 }}>
                    <Stack>
                      <Typography sx={{ fontSize: 13 }}>{t('label.weatherForecast__windSpeed')}</Typography>
                      <Typography sx={{ fontSize: 20 }}>{weather.forecasts[0]?.windSpeed} m/s</Typography>
                    </Stack>
                  </Grid>
                  <Grid item sx={{ mx: 1 }}>
                    <Stack>
                      <Typography sx={{ fontSize: 13 }}>{t('label.weatherForecast__humidity')}</Typography>
                      <Typography sx={{ fontSize: 20 }}>{weather.forecasts[0]?.humidity}%</Typography>
                    </Stack>
                  </Grid>
                  <Grid item sx={{ mx: 1 }}>
                    <Stack>
                      <Typography sx={{ fontSize: 13 }}>{t('label.weatherForecast__visibility')}</Typography>
                      <Typography sx={{ fontSize: 20 }}>
                        {weather.forecasts[0]?.visibility < 1000
                          ? `${weather.forecasts[0]?.visibility} m`
                          : `${weather.forecasts[0]?.visibility / 1000} km`}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item sx={{ mx: 1 }}>
                    <Stack>
                      <Typography sx={{ fontSize: 13 }}>{t('label.weatherForecast__pressure')}</Typography>
                      <Typography sx={{ fontSize: 20 }}>{weather.forecasts[0]?.pressure} hPa</Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </DarkRoundBox>
            </Grid>

            <Grid item xs={12} sm={5} order={{ xs: 3, sm: 1 }}>
              <DarkRoundBox sx={{ height: { xs: '150px', sm: '100%' } }}>
                <MapContainer
                  center={coord}
                  zoom={13}
                  tap={false}
                  tapTolerance={undefined}
                  scrollWheelZoom={false}
                  zoomControl={false}
                  attributionControl={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={coord} />
                </MapContainer>
              </DarkRoundBox>
            </Grid>

            <Grid item xs={12} order={{ xs: 1, sm: 2 }}>
              <DarkRoundBox>
                <Chart
                  series={
                    [
                      {
                        name: t('label.weatherForecast__temperature'),
                        data: chartWeather?.map((f) => [f.date, f.temperature]),
                      },
                      {
                        name: t('label.weatherForecast__humidity'),
                        data: chartWeather?.map((f) => [f.date, f.humidity]),
                      },
                    ] as ApexAxisChartSeries
                  }
                  height="150%"
                  options={{
                    chart: {
                      defaultLocale: 'ja',
                      locales: [jaLocale],
                      offsetY: 5,
                      toolbar: { show: false },
                      zoom: { enabled: false },
                      animations: {
                        easing: 'easeinout',
                        animateGradually: { enabled: false },
                        dynamicAnimation: { speed: 100 },
                      },
                    },
                    xaxis: {
                      type: 'datetime',
                      labels: {
                        style: { colors: 'white' },
                        format: 'HH:mm',
                        datetimeUTC: false,
                      },
                      tooltip: {
                        enabled: false,
                      },
                      tickAmount: 'dataPoints',
                    },
                    yaxis: [
                      {
                        labels: {
                          style: { colors: 'white' },
                          formatter: (val) => `${val.toFixed(0)}°`,
                        },
                        tickAmount: 4,
                        min: minTemperature,
                        max: maxTemperature,
                      },
                      {
                        labels: {
                          style: { colors: 'white' },
                          formatter: (val) => `${val.toFixed(0)}%`,
                        },
                        tickAmount: (maxHumidity! - minHumidity!) / 10,
                        min: minHumidity,
                        max: maxHumidity,
                        opposite: true,
                      },
                    ],
                    tooltip: {
                      theme: 'dark',
                      x: { format: 'yyyy/MM/dd HH:mm' },
                    },
                    stroke: {
                      curve: 'smooth',
                      width: [3, 3],
                      dashArray: [0, 3],
                    },
                    colors: ['#7FBF7F', '#BF7FFF'],
                    dataLabels: {
                      enabled: true,
                      enabledOnSeries: [0],
                      style: {
                        fontSize: '11px',
                        fontWeight: 'bold',
                      },
                    },
                    legend: { show: false },
                    title: {
                      text: t('label.weatherForecast__24forecast'),
                      offsetX: 5,
                      floating: true,
                      style: { fontWeight: 'normal', color: 'white' },
                    },
                  }}
                />
              </DarkRoundBox>
            </Grid>

            <Grid
              item
              xs={12}
              order={{ xs: 2, sm: 3 }}
              sx={{
                overflowY: 'hidden',
                overflowX: 'scroll',
                msOverflowStyle: 'none', // IE, Edge Legacy
                scrollbarWidth: 'none', // FireFox
                '&::-webkit-scrollbar': { display: 'none' }, // Chrome, Safari
              }}
            >
              <Stack direction="row" spacing={1}>
                {groupWeather?.map((x, i) => (
                  <DarkRoundBox key={`WeatherForecast__forecasts${i}`} sx={{ py: 1 }}>
                    <Typography noWrap sx={{ fontSize: 20, mx: 2, mb: 0.5 }}>{`${(x[1][0].date.getMonth() + 1)
                      .toString()
                      .padStart(2, '0')}/${x[1][0].date.getDate().toString().padStart(2, '0')}`}</Typography>
                    <Stack direction="row" spacing={1}>
                      {x[1].map((f, j) => (
                        <Stack key={`WeatherForecast__forecasts${i}--info${j}`} direction="column" alignItems="center">
                          <Typography noWrap sx={{ fontSize: 16, mx: 2 }}>{`${f.date
                            .getHours()
                            .toString()
                            .padStart(2, '0')}:${f.date.getMinutes().toString().padStart(2, '0')}`}</Typography>
                          <Stack direction="row" alignItems="start">
                            <img src={util.format(f.iconUrl, '')} />
                            <Stack>
                              <Typography sx={{ fontSize: 20, mr: 1 }}>{f.temperature}°</Typography>
                              <Typography sx={{ fontSize: 15 }}>{f.description}</Typography>
                            </Stack>
                          </Stack>
                        </Stack>
                      ))}
                    </Stack>
                  </DarkRoundBox>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Background>
    </Fade>
  );
};
