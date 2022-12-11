import './WeatherForecast.css';

import { Navigation as NavigationIcon, Place as PlaceIcon } from '@mui/icons-material';
import {
  Backdrop,
  Box,
  Container,
  experimental_sx,
  Fade,
  Grid,
  IconButton,
  LinearProgress,
  Slider,
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

import { useWeatherForecast } from '../hooks';
import { groupBy } from '../utils/array';
import { handleError } from '../utils/errors';
import { getWeatherIcon, getWeatherImage, getWeatherName } from '../utils/forecasts';

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
    () => weather && weather.forecasts.map((f) => f.temperature).reduce((_1, _2) => Math.max(_1, _2)) + 1,
    [weather]
  );
  const minTemperature = useMemo(
    () => weather && weather.forecasts.map((f) => f.temperature).reduce((_1, _2) => Math.min(_1, _2)) - 1,
    [weather]
  );
  const maxHumidity = useMemo(
    () =>
      weather &&
      Math.min(
        (Math.floor(weather.forecasts.map((f) => f.humidity).reduce((_1, _2) => Math.max(_1, _2)) / 10) + 1) * 10,
        100
      ),
    [weather]
  );
  const minHumidity = useMemo(
    () =>
      weather &&
      Math.max(
        (Math.floor(weather.forecasts.map((f) => f.humidity).reduce((_1, _2) => Math.min(_1, _2)) / 10) - 1) * 10,
        0
      ),
    [weather]
  );

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
            <Grid item xs={12} sm={6} order={0}>
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
                      <PlaceIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Typography sx={{ fontSize: 18 }}>
                  {`${(weather.forecasts[0].date.getMonth() + 1)
                    .toString()
                    .padStart(2, '0')}/${weather.forecasts[0].date.getDate().toString().padStart(2, '0')}(${t(
                    `label.weatherForecast__week--${weather.forecasts[0].date.getDay()}`
                  )})`}
                  &nbsp;&nbsp;
                  {`~ ${weather.forecasts[0].date.getHours().toString().padStart(2, '0')}:${weather.forecasts[0].date
                    .getMinutes()
                    .toString()
                    .padStart(2, '0')}`}
                </Typography>
                <Grid container alignItems="center" spacing={1.5}>
                  <Grid item>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box component="img" src={getWeatherIcon(weather.forecasts[0])} />
                      <Typography sx={{ fontSize: 62 }}>{weather.forecasts[0].temperature}°</Typography>
                    </Stack>
                  </Grid>
                  <Grid item>
                    <Stack direction="column">
                      <Typography sx={{ fontSize: isXs ? 22 : 24, fontWeight: 'bold' }}>
                        {getWeatherName(weather.forecasts[0], t)}
                      </Typography>
                      <Typography sx={{ fontSize: isXs ? 15 : 18 }}>
                        {t('label.weatherForecast__feelsLike')} {weather.forecasts[0].feelsLike}°
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
                <Grid container alignItems="center" spacing={leSm ? 1.5 : 3}>
                  <Grid item md={3}>
                    <Stack>
                      <Typography sx={{ fontSize: 13 }}>{t('label.weatherForecast__windSpeed')}</Typography>
                      <Stack direction="row" alignItems="center">
                        <Typography sx={{ fontSize: 20 }}>{weather.forecasts[0]?.windSpeed}</Typography>
                        <Typography sx={{ fontSize: 16 }}>&nbsp;m/s</Typography>
                        <NavigationIcon
                          sx={{
                            fontSize: 20,
                            transform: `rotate(${weather.forecasts[0]?.windDeg}deg)`,
                            color:
                              20 <= weather.forecasts[0]?.windSpeed
                                ? 'red'
                                : 15 <= weather.forecasts[0]?.windSpeed
                                ? 'orange'
                                : 10 <= weather.forecasts[0]?.windSpeed
                                ? 'yellow'
                                : 'auto',
                          }}
                        />
                      </Stack>
                    </Stack>
                  </Grid>
                  <Grid item md={3}>
                    <Stack>
                      <Typography sx={{ fontSize: 13 }}>{t('label.weatherForecast__humidity')}</Typography>
                      <Stack direction="row" alignItems="center">
                        <Typography sx={{ fontSize: 20 }}>{weather.forecasts[0]?.humidity}</Typography>
                        <Typography sx={{ fontSize: 16 }}>&nbsp;%</Typography>
                      </Stack>
                    </Stack>
                  </Grid>
                  <Grid item md={3}>
                    <Stack>
                      <Typography sx={{ fontSize: 13 }}>{t('label.weatherForecast__visibility')}</Typography>
                      <Stack direction="row" alignItems="center">
                        <Typography sx={{ fontSize: 20 }}>
                          {/* km は小数点以下第一位まで表示 */}
                          {weather.forecasts[0]?.visibility < 1000
                            ? weather.forecasts[0]?.visibility
                            : Math.floor(weather.forecasts[0]?.visibility / 100) / 10}
                        </Typography>
                        <Typography sx={{ fontSize: 16 }}>
                          &nbsp;{weather.forecasts[0]?.visibility < 1000 ? 'm' : 'km'}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Grid>
                  <Grid item md={3}>
                    <Stack>
                      <Typography sx={{ fontSize: 13 }}>{t('label.weatherForecast__pressure')}</Typography>
                      <Stack direction="row" alignItems="center">
                        <Typography sx={{ fontSize: 20 }}>{weather.forecasts[0]?.pressure}</Typography>
                        <Typography sx={{ fontSize: 16 }}>&nbsp;hPa</Typography>
                      </Stack>
                    </Stack>
                  </Grid>
                </Grid>
              </DarkRoundBox>
            </Grid>

            {/* マップ */}
            <Grid item xs={12} sm={6} order={{ xs: 4, sm: 1 }}>
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
            <Grid item xs={12} sm={7} md={8} lg={9} order={{ xs: 1, sm: 2 }}>
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
                        offsetX: 6,
                        offsetY: 12,
                        margin: -8,
                        style: { fontSize: '18', fontWeight: 'normal', color: 'white' },
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
                              width: { xs: '24px', sm: '30px', md: '40px', lg: '48px' },
                              height: { xs: '24px', sm: '30px', md: '40px', lg: '48px' },
                            }}
                          />
                          {leSm ? (
                            <>
                              <NavigationIcon
                                sx={{
                                  fontSize: { xs: 14, sm: 18 },
                                  transform: `rotate(${f.windDeg}deg)`,
                                  color:
                                    20 <= f.windSpeed
                                      ? 'red'
                                      : 15 <= f.windSpeed
                                      ? 'orange'
                                      : 10 <= f.windSpeed
                                      ? 'yellow'
                                      : 'auto',
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
                                <NavigationIcon
                                  sx={{
                                    fontSize: 14,
                                    transform: `rotate(${f.windDeg}deg)`,
                                    color:
                                      20 <= f.windSpeed
                                        ? 'red'
                                        : 15 <= f.windSpeed
                                        ? 'orange'
                                        : 10 <= f.windSpeed
                                        ? 'yellow'
                                        : 'auto',
                                  }}
                                />
                              </Stack>
                              <Typography sx={{ fontSize: 14 }}>{getWeatherName(f, t)}</Typography>
                            </>
                          )}
                        </Stack>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              </DarkRoundBox>
            </Grid>

            {/* その先の気温予想 */}
            <Grid item xs={12} sm={5} md={4} lg={3} order={{ xs: 2, sm: 3 }}>
              <DarkRoundBox sx={{ px: 2, pt: 1, pb: 2, height: isXs ? 'auto' : 'calc(100% - 24px)' }}>
                <Typography noWrap sx={{ fontSize: 18, mb: 1.5 }}>
                  {t('label.weatherForecast__weekTemperature')}
                </Typography>
                <Stack spacing={isXs ? 1 : 2}>
                  {groupWeather?.slice(1).map((x, i) => {
                    if (x[1].length !== DAY_VERTEX_COUNT) return <></>;
                    const minDayTemp = x[1].map((f) => f.temperature).reduce((_1, _2) => Math.min(_1, _2));
                    const maxDayTemp = x[1].map((f) => f.temperature).reduce((_1, _2) => Math.max(_1, _2));
                    return (
                      <Stack
                        key={`WeatherForecast__temperatures${i}`}
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{ width: '100%' }}
                      >
                        <Typography align="center" lineHeight={1.2}>
                          {(x[1][0].date.getMonth() + 1).toString().padStart(2, '0')}/
                          {x[1][0].date.getDate().toString().padStart(2, '0')}
                          <br />({t(`label.weatherForecast__week--${x[1][0].date.getDay()}`)})
                        </Typography>
                        <Slider
                          min={minTemperature}
                          max={maxTemperature}
                          marks={[
                            { value: minDayTemp, label: `${minDayTemp}°` },
                            { value: maxDayTemp, label: `${maxDayTemp}°` },
                          ]}
                          value={[minDayTemp, maxDayTemp]}
                          valueLabelDisplay="off"
                          sx={{
                            '& .MuiSlider-track': {
                              color: '#7EBD7F',
                              height: '2px',
                            },
                            '& .MuiSlider-thumb.Mui-disabled': {
                              color: '#7EBD7F',
                              width: '14px',
                              height: '14px',
                            },
                            '& .MuiSlider-markLabel': {
                              top: '32px',
                              marginLeft: '2px',
                            },
                          }}
                          disabled
                        />
                      </Stack>
                    );
                  })}
                </Stack>
              </DarkRoundBox>
            </Grid>

            {/* 長期予報 */}
            <Grid
              item
              xs={12}
              order={{ xs: 3, sm: 4 }}
              sx={{
                overflowY: 'hidden',
                overflowX: 'scroll',
                msOverflowStyle: 'none', // IE, Edge Legacy
                scrollbarWidth: 'none', // FireFox
                '&::-webkit-scrollbar': { display: 'none' }, // Chrome, Safari
              }}
            >
              <Stack direction="row" spacing={2}>
                {groupWeather?.slice(1).map(
                  (x, i) =>
                    x[1].length === DAY_VERTEX_COUNT && (
                      <DarkRoundBox key={`WeatherForecast__forecasts${i}`} sx={{ px: 2, py: 1 }}>
                        <Typography noWrap sx={{ fontSize: 18, mb: 0.5 }}>
                          {i === 0 + groupOffset
                            ? `${t('label.weatherForecast__date--tomorrow')}\u00A0`
                            : i === 1 + groupOffset
                            ? `${t('label.weatherForecast__date--dayAfterTomorrow')}\u00A0`
                            : null}
                          {`${(x[1][0].date.getMonth() + 1).toString().padStart(2, '0')}/${x[1][0].date
                            .getDate()
                            .toString()
                            .padStart(2, '0')}(${t(
                            `label.weatherForecast__week--${x[1][0].date.getDay()}`
                          )})\u00A0\u00A0${x[1].map((f) => f.temperature).reduce((_1, _2) => Math.min(_1, _2))}°~ ${x[1]
                            .map((f) => f.temperature)
                            .reduce((_1, _2) => Math.max(_1, _2))}°`}
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          {x[1].map((f, j) => (
                            <Stack
                              key={`WeatherForecast__forecasts${i}--info${j}`}
                              direction="column"
                              alignItems="center"
                            >
                              <Typography noWrap sx={{ fontSize: 16 }}>{`${f.date
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
                              <Typography sx={{ fontSize: 20, ml: 0.5 }}>{f.temperature}°</Typography>
                              <Typography sx={{ fontSize: 14 }} noWrap>
                                {getWeatherName(f, t)}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </DarkRoundBox>
                    )
                )}
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
