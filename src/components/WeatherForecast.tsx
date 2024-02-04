import './WeatherForecast.css';

import { Navigation as NavigationIcon, Place as PlaceIcon } from '@mui/icons-material';
import {
  Backdrop,
  Box,
  Container,
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

import { constants } from '../constants';
import { Forecast, Weather } from '../entities/weather';
import { useWeatherForecast } from '../hooks';
import { groupBy } from '../utils/array';
import { getDateString, getMonthDayString, getTimeString } from '../utils/date';
import { handleError } from '../utils/errors';
import { getWeatherIcon, getWeatherImage, getWeatherName } from '../utils/weather';

Leaflet.Icon.Default.imagePath = '//cdnjs.cloudflare.com/ajax/libs/leaflet/1.8.0/images/';

const Image = styled(Box)(({ theme }) =>
  theme.unstable_sx({
    position: 'relative',
    minHeight: '100vh',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    backgroundAttachment: 'fixed',
  })
);

const RoundBox = styled(Box)(({ theme }) =>
  theme.unstable_sx({
    background: '#254F8FBB',
    borderRadius: 2,
    boxShadow: 1,
  })
);

const DAY_VERTEX_COUNT = 8;

const getWindSpeedColor = (windSpeed: number) =>
  20 <= windSpeed ? 'red' : 15 <= windSpeed ? 'orange' : 10 <= windSpeed ? 'yellow' : 'auto';

// eslint-disable-next-line complexity
export const WeatherForecast = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);

  const [t] = useTranslation();
  const [isPending, setIsPending] = useState(false);
  const [coord, setCoord] = useState<LatLng>();

  const forecast = useWeatherForecast(coord);
  const weathers4Chart = useMemo(() => forecast && forecast.weathers.slice(0, DAY_VERTEX_COUNT + 1), [forecast]);
  const weathers4Detail = useMemo(
    () => forecast && groupBy(forecast.weathers, (w) => getDateString(w.date)),
    [forecast]
  );
  const minTemp = useMemo(
    () => forecast && forecast.weathers.map((w) => w.temperature).reduce((_1, _2) => Math.min(_1, _2)),
    [forecast]
  );
  const maxTemp = useMemo(
    () => forecast && forecast.weathers.map((w) => w.temperature).reduce((_1, _2) => Math.max(_1, _2)),
    [forecast]
  );
  const minHum = useMemo(
    () => forecast && forecast.weathers.map((w) => w.humidity).reduce((_1, _2) => Math.min(_1, _2)),
    [forecast]
  );
  const maxHum = useMemo(
    () => forecast && forecast.weathers.map((w) => w.humidity).reduce((_1, _2) => Math.max(_1, _2)),
    [forecast]
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
            const message = t('message.notify__getCurrentPosition--succeeded');
            toast.info(message);
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
    // TODO: ユーザからの要求無しに現在地の取得が不可に Only request geolocation information in response to a user gesture.
    setCoord(new LatLng(35.69, 139.69));
    // 初回レンダリング時に現在地を取得する
    // navigator.geolocation.getCurrentPosition(
    //   (position) => {
    //     setCoord(new LatLng(position.coords.latitude, position.coords.longitude));
    //   },
    //   (error) => {
    //     setCoord(new LatLng(35.69, 139.69));
    //     console.log(error);
    //   }
    // );
  }, []);

  useEffect(() => {
    // 位置情報が更新された際にマップを移動する
    mapRef.current?.flyTo(coord);
  }, [coord]);

  if (!coord || !forecast || !weathers4Chart || !weathers4Detail || !minTemp || !maxTemp || !minHum || !maxHum)
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
      <Image sx={{ backgroundImage: `url(${getWeatherImage(forecast.weathers[0])})` }}>
        <Container sx={{ pt: [4, 12], pb: [4, 12] }}>
          <Grid container spacing={2}>
            {/* 現在の天気 */}
            <Grid item xs={12} sm={6} order={0}>
              <NowWeather
                forecast={forecast}
                isPending={isPending}
                onClickGetCurrentPosition={onClickGetCurrentPosition}
              />
            </Grid>

            {/* マップ */}
            <Grid item xs={12} sm={6} order={{ xs: 4, sm: 1 }}>
              <RoundBox sx={{ height: ['150px', '100%'] }}>
                <MapContainer
                  ref={mapRef}
                  center={coord}
                  zoom={13}
                  tap={false}
                  tapTolerance={undefined}
                  scrollWheelZoom={false}
                  attributionControl={false}
                >
                  <TileLayer url={constants.url.getMapImage} />
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
              </RoundBox>
            </Grid>

            {/* 24時間推移 */}
            <Grid item xs={12} sm={7} md={8} lg={9} order={{ xs: 1, sm: 2 }}>
              <TodayWeather
                weathers4Chart={weathers4Chart}
                minTemp={minTemp}
                maxTemp={maxTemp}
                minHum={minHum}
                maxHum={maxHum}
              />
            </Grid>

            {/* その先の気温予想 */}
            <Grid item xs={12} sm={5} md={4} lg={3} order={{ xs: 2, sm: 3 }}>
              <Temperatures weathers4Detail={weathers4Detail} minTemp={minTemp} maxTemp={maxTemp} />
            </Grid>

            {/* 長期予報詳細 */}
            <Grid item xs={12} order={{ xs: 3, sm: 4 }}>
              <Forecasts weathers4Detail={weathers4Detail} />
            </Grid>
          </Grid>
        </Container>
        <Backdrop sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isPending}>
          <LinearProgress color="inherit" sx={{ width: '80%' }} />
        </Backdrop>
      </Image>
    </Fade>
  );
};

const NowWeather = ({
  forecast,
  isPending,
  onClickGetCurrentPosition,
}: {
  forecast: Forecast;
  isPending: boolean;
  onClickGetCurrentPosition: React.MouseEventHandler<HTMLButtonElement>;
}) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const leSm = useMediaQuery(theme.breakpoints.down('md'));
  const [t] = useTranslation();
  return (
    <RoundBox sx={{ p: [2, 4] }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Typography sx={{ fontSize: 20, fontWeight: 'bold' }}>
          {util.format(t('format.weatherForecast__cityWeather'), forecast.city)}
        </Typography>
        <Tooltip title={t('command.getCurrentPosition')}>
          <IconButton sx={{ background: '#254F8F88' }} disabled={isPending} onClick={onClickGetCurrentPosition}>
            <PlaceIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      <Typography sx={{ fontSize: 18 }}>
        {getMonthDayString(forecast.weathers[0].date)}
        &nbsp;
        {`(${t(`label.weatherForecast__week--${forecast.weathers[0].date.getDay()}`)})`}
        &nbsp;&nbsp;
        {'~'}
        &nbsp;
        {getTimeString(forecast.weathers[0].date)}
      </Typography>
      <Grid container alignItems="center" spacing={1.5}>
        <Grid item>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              component="img"
              src={getWeatherIcon(forecast.weathers[0])}
              alt="weather icon"
              loading="lazy"
              decoding="async"
            />
            <Typography sx={{ fontSize: 62 }}>{forecast.weathers[0].temperature}°</Typography>
          </Stack>
        </Grid>
        <Grid item>
          <Stack direction="column">
            <Typography sx={{ fontSize: isXs ? 22 : 24, fontWeight: 'bold' }}>
              {getWeatherName(forecast.weathers[0], t)}
            </Typography>
            <Typography sx={{ fontSize: isXs ? 15 : 18 }}>
              {t('label.weatherForecast__selfTemperature')} {forecast.weathers[0].selfTemperature}°
            </Typography>
          </Stack>
        </Grid>
      </Grid>
      <Grid container alignItems="center" spacing={leSm ? 1.5 : 3}>
        <Grid item md={3}>
          <Stack>
            <Typography sx={{ fontSize: 13 }}>{t('label.weatherForecast__windSpeed')}</Typography>
            <Stack direction="row" alignItems="center">
              <Typography sx={{ fontSize: 20 }}>{forecast.weathers[0]?.windSpeed}</Typography>
              <Typography sx={{ fontSize: 16 }}>&nbsp;m/s&nbsp;</Typography>
              <NavigationIcon
                sx={{
                  fontSize: 18,
                  transform: `rotate(${forecast.weathers[0]?.windDegree}deg)`,
                  color: getWindSpeedColor(forecast.weathers[0]?.windSpeed),
                }}
              />
            </Stack>
          </Stack>
        </Grid>
        <Grid item md={3}>
          <Stack>
            <Typography sx={{ fontSize: 13 }}>{t('label.weatherForecast__humidity')}</Typography>
            <Stack direction="row" alignItems="center">
              <Typography sx={{ fontSize: 20 }}>{forecast.weathers[0]?.humidity}</Typography>
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
                {forecast.weathers[0]?.visibility < 1000
                  ? forecast.weathers[0]?.visibility
                  : Math.floor(forecast.weathers[0]?.visibility / 100) / 10}
              </Typography>
              <Typography sx={{ fontSize: 16 }}>
                &nbsp;{forecast.weathers[0]?.visibility < 1000 ? 'm' : 'km'}
              </Typography>
            </Stack>
          </Stack>
        </Grid>
        <Grid item md={3}>
          <Stack>
            <Typography sx={{ fontSize: 13 }}>{t('label.weatherForecast__pressure')}</Typography>
            <Stack direction="row" alignItems="center">
              <Typography sx={{ fontSize: 20 }}>{forecast.weathers[0]?.pressure}</Typography>
              <Typography sx={{ fontSize: 16 }}>&nbsp;hPa</Typography>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </RoundBox>
  );
};

const TodayWeather = ({
  weathers4Chart,
  minTemp,
  maxTemp,
  minHum,
  maxHum,
}: {
  weathers4Chart: Weather[];
  minTemp: number;
  maxTemp: number;
  minHum: number;
  maxHum: number;
}) => {
  const theme = useTheme();
  const leSm = useMediaQuery(theme.breakpoints.down('md'));
  const [t] = useTranslation();
  return (
    <RoundBox>
      <Stack>
        <Chart
          height="100%"
          series={
            [
              {
                name: t('label.weatherForecast__temperature'),
                data: weathers4Chart?.map((w) => [w.date, w.temperature]),
              },
              {
                name: t('label.weatherForecast__humidity'),
                data: weathers4Chart?.map((w) => [w.date, w.humidity]),
              },
            ] as ApexAxisChartSeries
          }
          options={{
            title: {
              text: t('label.weatherForecast__24forecast'),
              offsetX: 6,
              offsetY: 10,
              margin: 0,
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
                fontSize: '13px',
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
                min: minTemp - 1,
                max: maxTemp + 1,
              },
              {
                labels: {
                  offsetX: leSm ? -20 : -10,
                  style: { colors: 'white' },
                  formatter: (val) => `${val.toFixed(0)}%`,
                },
                tickAmount: Math.floor(maxHum / 10) + 1 - (Math.floor(minHum / 10) - 1),
                min: Math.min((Math.floor(minHum / 10) - 1) * 10, 100),
                max: Math.max((Math.floor(maxHum / 10) + 1) * 10, 0),
                opposite: true,
              },
            ],
            stroke: {
              curve: 'smooth',
              width: [3, 3],
              dashArray: [0, 5],
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
          {weathers4Chart.map((w, i) => (
            <Grid item key={`WeatherForecast__chart--weather${i}`}>
              <Stack direction="column" alignItems="center">
                <Box
                  component="img"
                  src={getWeatherIcon(w)}
                  alt="weather icon"
                  loading="lazy"
                  decoding="async"
                  sx={{
                    width: { xs: '24px', sm: '30px', md: '40px', lg: '48px' },
                    height: { xs: '24px', sm: '30px', md: '40px', lg: '48px' },
                    my: { xs: 0.5, md: 1 },
                  }}
                />
                {leSm ? (
                  <>
                    <NavigationIcon
                      sx={{
                        fontSize: { xs: 14, sm: 18 },
                        transform: `rotate(${w.windDegree}deg)`,
                        color: getWindSpeedColor(w.windSpeed),
                      }}
                    />
                    <Typography sx={{ fontSize: { xs: 15, sm: 18 }, ml: 0.5 }}>{w.temperature}°</Typography>
                    <Typography sx={{ fontSize: { xs: 9, sm: 12 } }}>{getWeatherName(w, t)}</Typography>
                  </>
                ) : (
                  <>
                    <Stack direction="row" alignItems="center">
                      <Typography sx={{ fontSize: 14 }}>{w.windSpeed} m/s </Typography>
                      <NavigationIcon
                        sx={{
                          fontSize: 14,
                          transform: `rotate(${w.windDegree}deg)`,
                          color: getWindSpeedColor(w.windSpeed),
                        }}
                      />
                    </Stack>
                    <Typography sx={{ fontSize: 20, ml: 0.5 }}>{w.temperature}°</Typography>
                    <Typography sx={{ fontSize: 14 }}>{getWeatherName(w, t)}</Typography>
                  </>
                )}
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </RoundBox>
  );
};

const Temperatures = ({
  weathers4Detail,
  minTemp,
  maxTemp,
}: {
  weathers4Detail: [string, Weather[]][];
  minTemp: number;
  maxTemp: number;
}) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const [t] = useTranslation();
  return (
    <RoundBox sx={{ pl: 2, pr: 3, pt: 1.5, pb: 2, height: isXs ? 'auto' : 'calc(100% - 28px)' }}>
      <Typography noWrap sx={{ fontSize: 18, mb: 1.5 }}>
        {t('label.weatherForecast__weekTemperature')}
      </Typography>
      <Stack spacing={isXs ? 1 : 2}>
        {weathers4Detail.slice(1).map((x, i) => {
          if (x[1].length !== DAY_VERTEX_COUNT) return <></>;
          const minTemp4Day = x[1].map((w) => w.temperature).reduce((_1, _2) => Math.min(_1, _2));
          const maxTemp4Day = x[1].map((w) => w.temperature).reduce((_1, _2) => Math.max(_1, _2));
          return (
            <Stack
              key={`WeatherForecast__temperatures${i}`}
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{ width: '100%' }}
            >
              <Typography align="center" lineHeight={1.2}>
                {getMonthDayString(x[1][0].date)}
                <br />({t(`label.weatherForecast__week--${x[1][0].date.getDay()}`)})
              </Typography>
              <Slider
                min={minTemp}
                max={maxTemp}
                marks={[
                  { value: minTemp4Day, label: `${minTemp4Day}°` },
                  { value: maxTemp4Day, label: `${maxTemp4Day}°` },
                ]}
                value={[minTemp4Day, maxTemp4Day]}
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
    </RoundBox>
  );
};

const Forecasts = ({ weathers4Detail }: { weathers4Detail: [string, Weather[]][] }) => {
  const [t] = useTranslation();
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        overflowY: 'hidden',
        overflowX: 'scroll',
        msOverflowStyle: 'none', // IE, Edge Legacy
        scrollbarWidth: 'none', // FireFox
        '&::-webkit-scrollbar': { display: 'none' }, // Chrome, Safari
      }}
    >
      {weathers4Detail.slice(1).map((x, i) => {
        if (x[1].length !== DAY_VERTEX_COUNT) return <></>;
        const offset = weathers4Detail[0][1].length === DAY_VERTEX_COUNT ? -1 : 0;
        return (
          <RoundBox key={`WeatherForecast__forecasts${i}`} sx={{ px: 2, py: 1 }}>
            <Typography noWrap sx={{ fontSize: 18, mb: 1 }}>
              {i === offset + 0 && `${t('label.weatherForecast__date--tomorrow')}\u00A0`}
              {i === offset + 1 && `${t('label.weatherForecast__date--dayAfterTomorrow')}\u00A0`}
              {getMonthDayString(x[1][0].date)}
              &nbsp;
              {`(${t(`label.weatherForecast__week--${x[1][0].date.getDay()}`)})`}
              &nbsp;&nbsp;
              {`${x[1].map((w) => w.temperature).reduce((_1, _2) => Math.min(_1, _2))}°`}
              {'~'}&nbsp;
              {`${x[1].map((w) => w.temperature).reduce((_1, _2) => Math.max(_1, _2))}°`}
            </Typography>
            <Stack direction="row" spacing={2}>
              {x[1].map((w, j) => (
                <Stack key={`WeatherForecast__forecasts${i}--info${j}`} direction="column" alignItems="center">
                  <Typography noWrap sx={{ fontSize: 16 }}>
                    {getTimeString(w.date)}
                  </Typography>
                  <Box
                    component="img"
                    src={getWeatherIcon(w)}
                    alt="weather icon"
                    loading="lazy"
                    decoding="async"
                    sx={{ width: '32px', height: '32px', my: 1 }}
                  />
                  <Typography sx={{ fontSize: 20, ml: 0.5 }}>{w.temperature}°</Typography>
                  <Typography sx={{ fontSize: 14 }} noWrap>
                    {getWeatherName(w, t)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </RoundBox>
        );
      })}
    </Stack>
  );
};
