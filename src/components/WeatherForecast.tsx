import './WeatherForecast.css';

import { MyLocation as MyLocationIcon, Navigation as NavigationIcon } from '@mui/icons-material';
import {
  Backdrop,
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import jaLocale from 'apexcharts/dist/locales/ja.json';
import Leaflet, { LatLng } from 'leaflet';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'react-apexcharts';
import { useTranslation } from 'react-i18next';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { toast } from 'react-toastify';
import * as util from 'util';

import iconCloudy from '../assets/weatherIcon/cloudy.png';
import iconDay from '../assets/weatherIcon/day.png';
import iconDayCloudy from '../assets/weatherIcon/day-cloudy.png';
import iconFoggy from '../assets/weatherIcon/foggy.png';
import iconNight from '../assets/weatherIcon/night.png';
import iconNightCloudy from '../assets/weatherIcon/night-cloudy.png';
import iconRainy from '../assets/weatherIcon/rainy.png';
import iconSnowy from '../assets/weatherIcon/snowy.png';
import iconStormy from '../assets/weatherIcon/stormy.png';
import imageCloudy from '../assets/weatherImage/cloudy.webp';
import imageDay from '../assets/weatherImage/day.webp';
import imageDayCloudy from '../assets/weatherImage/day-cloudy.webp';
import imageFoggy from '../assets/weatherImage/foggy.webp';
import imageNight from '../assets/weatherImage/night.webp';
import imageNightCloudy from '../assets/weatherImage/night-cloudy.webp';
import imageRainy from '../assets/weatherImage/rainy.webp';
import imageSnowy from '../assets/weatherImage/snowy.webp';
import imageStormy from '../assets/weatherImage/stormy.webp';
import { useWeatherForecast } from '../hooks';
import { Forecast } from '../hooks/useWeatherForecast';
import { groupBy } from '../utils/array';
import { handleError } from '../utils/errors';

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

const DAY_VERTEX_COUNT = 8;

// eslint-disable-next-line complexity
export const WeatherForecast = () => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const leSm = useMediaQuery(theme.breakpoints.down('md'));

  const [t] = useTranslation();
  const [isPending, setIsPending] = useState(false);
  const [coord, setCoord] = useState<LatLng>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const weather = useWeatherForecast(coord);

  const groupWeather = useMemo(() => weather && groupBy(weather.forecasts, (f) => f.ymd), [weather]);
  const groupOffset = useMemo(
    () => (groupWeather && groupWeather[0][1].length === DAY_VERTEX_COUNT ? -1 : 0),
    [groupWeather]
  );

  const chartWeather = useMemo(() => weather && weather.forecasts.slice(0, DAY_VERTEX_COUNT + 1), [weather]);
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

  const inDayTime = (date: Date) => 6 <= date.getHours() && date.getHours() <= 18;

  // eslint-disable-next-line complexity
  const getWeatherImage = useCallback((forecast: Forecast) => {
    switch (forecast.group) {
      case 'Thunderstorm':
        return imageStormy;
      case 'Drizzle':
        return imageRainy;
      case 'Rain':
        return imageRainy;
      case 'Snow':
        return imageSnowy;
      case 'Atmosphere':
        return imageFoggy;
      case 'Clouds':
        return imageCloudy;
      case 'FewClouds':
        return inDayTime(forecast.date) ? imageDayCloudy : imageNightCloudy;
      case 'Clear':
      default:
        return inDayTime(forecast.date) ? imageDay : imageNight;
    }
  }, []);

  // eslint-disable-next-line complexity
  const getWeatherIcon = useCallback((forecast: Forecast) => {
    switch (forecast.group) {
      case 'Thunderstorm':
        return iconStormy;
      case 'Drizzle':
        return iconRainy;
      case 'Rain':
        return iconRainy;
      case 'Snow':
        return iconSnowy;
      case 'Atmosphere':
        return iconFoggy;
      case 'Clouds':
        return iconCloudy;
      case 'FewClouds':
        return inDayTime(forecast.date) ? iconDayCloudy : iconNightCloudy;
      case 'Clear':
      default:
        return inDayTime(forecast.date) ? iconDay : iconNight;
    }
  }, []);

  const onMarkerDragend = useCallback(() => {
    const marker = markerRef.current;
    if (marker !== null) setCoord(marker.getLatLng());
  }, []);

  const onClickGetCurrentPosition = useCallback(() => {
    setIsPending(true);
    setTimeout(
      () =>
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setIsPending(false);
            setCoord(new LatLng(position.coords.latitude, position.coords.longitude));
            toast.info(t('message.notify__getCurrentPosition--succeeded'));
          },
          (error) => {
            setIsPending(false);
            handleError(error);
          }
        ),
      300
    );
  }, [t]);

  useEffect(() => {
    // 初回レンダリング時に現在地を取得する
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoord(new LatLng(position.coords.latitude, position.coords.longitude));
      },
      (error) => {
        setCoord(new LatLng(35.69, 139.69));
        console.log(error);
      }
    );
  }, []);

  useEffect(() => {
    // 位置情報が更新された際にマップを移動する
    mapRef.current?.flyTo(coord);
  }, [coord]);

  if (!coord || !weather)
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
      <Background sx={{ backgroundImage: `url(${getWeatherImage(weather.forecasts[0])})` }}>
        <Container sx={{ pt: [4, 12], pb: [4, 12] }}>
          <Grid container spacing={2}>
            {/* 現在の気象情報 */}
            <Grid item xs={12} sm={7} order={0}>
              <DarkRoundBox sx={{ p: [2, 4] }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Typography sx={{ fontSize: 20, fontWeight: 'bold' }}>
                    {util.format(t('format.weatherForecast__cityWeather'), weather.city)}
                  </Typography>
                  <Tooltip title={t('command.getCurrentPosition')}>
                    <IconButton
                      sx={{ background: '#254F8F88' }}
                      disabled={isPending}
                      onClick={onClickGetCurrentPosition}
                    >
                      <MyLocationIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Typography sx={{ fontSize: 16 }}>
                  {`${(weather.forecasts[0].date.getMonth() + 1)
                    .toString()
                    .padStart(2, '0')}/${weather.forecasts[0].date.getDate().toString().padStart(2, '0')}(${t(
                    `label.weatherForecast__week--${weather.forecasts[0].date.getDay()}`
                  )})`}
                  &nbsp;&nbsp;
                  {`~${weather.forecasts[0].date.getHours().toString().padStart(2, '0')}:${weather.forecasts[0].date
                    .getMinutes()
                    .toString()
                    .padStart(2, '0')}`}
                </Typography>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item sx={{ ml: isXs ? 0.5 : 2 }}>
                    <Box component="img" src={getWeatherIcon(weather.forecasts[0])} />
                  </Grid>
                  <Grid item>
                    <Typography sx={{ fontSize: 62 }}>{weather.forecasts[0].temperature}°</Typography>
                  </Grid>
                  <Grid item>
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
                  <Grid item sx={{ mr: 2 }}>
                    <Stack>
                      <Typography sx={{ fontSize: 13 }}>{t('label.weatherForecast__windSpeed')}</Typography>
                      <Stack direction="row" alignItems="center">
                        <Typography sx={{ fontSize: 20 }}>{weather.forecasts[0]?.windSpeed} m/s</Typography>
                        <NavigationIcon
                          sx={{ fontSize: 20, transform: `rotate(${weather.forecasts[0]?.windDeg}deg)` }}
                        />
                      </Stack>
                    </Stack>
                  </Grid>
                  <Grid item sx={{ mr: 2 }}>
                    <Stack>
                      <Typography sx={{ fontSize: 13 }}>{t('label.weatherForecast__humidity')}</Typography>
                      <Typography sx={{ fontSize: 20 }}>{weather.forecasts[0]?.humidity}%</Typography>
                    </Stack>
                  </Grid>
                  <Grid item sx={{ mr: 2 }}>
                    <Stack>
                      <Typography sx={{ fontSize: 13 }}>{t('label.weatherForecast__visibility')}</Typography>
                      <Typography sx={{ fontSize: 20 }}>
                        {/* km は小数点以下第一位まで表示 */}
                        {weather.forecasts[0]?.visibility < 1000
                          ? `${weather.forecasts[0]?.visibility} m`
                          : `${Math.floor(weather.forecasts[0]?.visibility / 100) / 10} km`}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item>
                    <Stack>
                      <Typography sx={{ fontSize: 13 }}>{t('label.weatherForecast__pressure')}</Typography>
                      <Typography sx={{ fontSize: 20 }}>{weather.forecasts[0]?.pressure} hPa</Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </DarkRoundBox>
            </Grid>

            {/* マップ */}
            <Grid item xs={12} sm={5} order={{ xs: 3, sm: 1 }}>
              <DarkRoundBox sx={{ height: ['150px', '100%'] }}>
                <MapContainer
                  ref={mapRef}
                  center={coord}
                  zoom={13}
                  tap={false}
                  tapTolerance={undefined}
                  scrollWheelZoom={false}
                  attributionControl={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker
                    ref={markerRef}
                    position={coord}
                    eventHandlers={{
                      dragend: onMarkerDragend,
                    }}
                    draggable
                  >
                    <Popup>
                      {coord.lat}, {coord.lng}
                    </Popup>
                  </Marker>
                </MapContainer>
              </DarkRoundBox>
            </Grid>

            {/* グラフ */}
            <Grid item xs={12} order={{ xs: 1, sm: 2 }}>
              <DarkRoundBox>
                <Stack>
                  <Chart
                    height="100%"
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
                    options={{
                      title: {
                        text: t('label.weatherForecast__24forecast'),
                        offsetX: 0,
                        offsetY: 10,
                        margin: -10,
                        style: { fontSize: '16', fontWeight: 'normal', color: 'white' },
                      },
                      grid: {
                        padding: {
                          left: leSm ? 0 : 10,
                          right: leSm ? -10 : 0,
                        },
                      },
                      chart: {
                        defaultLocale: 'ja',
                        locales: [jaLocale],
                        toolbar: { show: false },
                        zoom: { enabled: false },
                        animations: {
                          easing: 'easeinout',
                          animateGradually: { enabled: false },
                        },
                      },
                      dataLabels: {
                        enabled: true,
                        enabledOnSeries: [0],
                        style: {
                          fontSize: '11px',
                          fontWeight: 'bold',
                        },
                      },
                      tooltip: {
                        theme: 'dark',
                        x: { format: 'yyyy/MM/dd HH:mm' },
                      },
                      legend: {
                        show: false,
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
                            offsetX: leSm ? -10 : 0,
                            style: { colors: 'white' },
                            formatter: (val) => `${val.toFixed(0)}°`,
                          },
                          tickAmount: 4,
                          min: minTemperature,
                          max: maxTemperature,
                        },
                        {
                          labels: {
                            offsetX: leSm ? -20 : -10,
                            style: { colors: 'white' },
                            formatter: (val) => `${val.toFixed(0)}%`,
                          },
                          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                          tickAmount: (maxHumidity! - minHumidity!) / 10,
                          min: minHumidity,
                          max: maxHumidity,
                          opposite: true,
                        },
                      ],
                      stroke: {
                        curve: 'smooth',
                        width: [3, 3],
                        dashArray: [0, 3],
                      },
                      colors: ['#7FBF7F', '#BF7FFF'],
                    }}
                  />

                  <Grid
                    container
                    justifyContent="space-between"
                    alignItems="center"
                    wrap="nowrap"
                    sx={{ pl: '21px', pr: '27px', mb: 0.5 }}
                  >
                    {chartWeather?.map((f, i) => (
                      <Grid item key={`WeatherForecast__chart--weather${i}`}>
                        <Stack direction="column" alignItems="center">
                          <Box
                            component="img"
                            src={getWeatherIcon(f)}
                            sx={{
                              my: 0.5,
                              width: { xs: '24px', sm: '32px', md: '40px', lg: '48px' },
                              height: { xs: '24px', sm: '32px', md: '40px', lg: '48px' },
                            }}
                          />
                          {leSm ? (
                            <>
                              <NavigationIcon
                                sx={{
                                  fontSize: { xs: 14, sm: 18 },
                                  transform: `rotate(${f.windDeg}deg)`,
                                }}
                              />
                              <Stack direction="row" alignItems="center" sx={{ mt: 0.5 }}>
                                <Typography sx={{ fontSize: { xs: 13, sm: 16 } }}>{f.windSpeed}</Typography>
                                <Typography sx={{ fontSize: { xs: 9, sm: 12 } }}>&nbsp;m/s</Typography>
                              </Stack>
                            </>
                          ) : (
                            <>
                              <Stack direction="row" alignItems="center">
                                <Typography sx={{ fontSize: 14 }}>{f.windSpeed} m/s</Typography>
                                <NavigationIcon sx={{ fontSize: 14, transform: `rotate(${f.windDeg}deg)` }} />
                              </Stack>
                              <Typography sx={{ fontSize: 14 }}>{f.description}</Typography>
                            </>
                          )}
                        </Stack>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              </DarkRoundBox>
            </Grid>

            {/* 長期予報 */}
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
                {groupWeather?.slice(1).map((x, i) => (
                  <DarkRoundBox key={`WeatherForecast__forecasts${i}`} sx={{ py: 1 }}>
                    <Typography noWrap sx={{ fontSize: 18, mx: 2, mb: 0.5 }}>
                      {i === 0 + groupOffset
                        ? `${t('label.weatherForecast__date--tomorrow')}\u00A0`
                        : i === 1 + groupOffset
                        ? `${t('label.weatherForecast__date--dayAfterTomorrow')}\u00A0`
                        : null}
                      {`${(x[1][0].date.getMonth() + 1).toString().padStart(2, '0')}/${x[1][0].date
                        .getDate()
                        .toString()
                        .padStart(2, '0')}(${t(`label.weatherForecast__week--${x[1][0].date.getDay()}`)})`}
                      {x[1].length === DAY_VERTEX_COUNT &&
                        `\u00A0\u00A0${x[1].map((f) => f.temperature).reduce((_1, _2) => Math.min(_1, _2))}°~ ${x[1]
                          .map((f) => f.temperature)
                          .reduce((_1, _2) => Math.max(_1, _2))}°`}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mx: 1 }}>
                      {x[1].map((f, j) => (
                        <Stack key={`WeatherForecast__forecasts${i}--info${j}`} direction="column" alignItems="center">
                          <Typography noWrap sx={{ fontSize: 16, mx: 1.5 }}>{`${f.date
                            .getHours()
                            .toString()
                            .padStart(2, '0')}:${f.date.getMinutes().toString().padStart(2, '0')}`}</Typography>
                          <Box
                            component="img"
                            src={getWeatherIcon(f)}
                            sx={{
                              my: 0.5,
                              width: '32px',
                              height: '32px',
                            }}
                          />
                          <Typography sx={{ fontSize: 20, ml: 1 }}>{f.temperature}°</Typography>
                          <Stack direction="row" alignItems="center" sx={{ mt: 0.5 }}>
                            <Typography sx={{ fontSize: 14 }}>{f.windSpeed} m/s</Typography>
                            <NavigationIcon sx={{ fontSize: 14, transform: `rotate(${f.windDeg}deg)` }} />
                          </Stack>
                          <Typography sx={{ fontSize: 14 }}>{f.description}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </DarkRoundBox>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Container>
        <Backdrop sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isPending}>
          <LinearProgress color="inherit" sx={{ width: '80%' }} />
        </Backdrop>
      </Background>
    </Fade>
  );
};
