import { useEffect, useState } from 'react';

import { createInstance } from '../api/axios';
import { OpenWeatherMapApiResponse } from '../api/responses';
import { constants } from '../constants';
import { handleError } from '../errors';

export type Coordinate = {
  lat: number;
  lon: number;
};

export type WeatherGroup =
  | 'Thunderstorm'
  | 'Drizzle'
  | 'Rain'
  | 'Snow'
  | 'Atmosphere'
  | 'Clear'
  | 'Clouds'
  | 'FewClouds';

export type Forecast = {
  date: Date;
  group: WeatherGroup;
  summary: string;
  description: string;
  temperature: number;
  wind: number;
  iconUrl: string;
};

export type Weather = {
  city: string;
  country: string;
  lat: number;
  lon: number;
  forecasts: Forecast[];
};

/**
 * WeatherGroup を推定します。
 *
 * WeatherGroup の仕様は下記を参照
 * https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2
 * @param weatherId WeatherID
 * @returns WeatherGroup
 */
const getWeatherGroup = (weatherId: number): WeatherGroup => {
  if (803 <= weatherId) return 'Clouds';
  if (801 <= weatherId) return 'FewClouds'; // これは独自の区分、曇りの状態を２つに分ける
  if (800 === weatherId) return 'Clear';
  if (700 <= weatherId) return 'Atmosphere';
  if (600 <= weatherId) return 'Snow';
  if (500 <= weatherId) return 'Rain';
  if (300 <= weatherId) return 'Drizzle';
  if (200 <= weatherId) return 'Thunderstorm';
  throw new RangeError();
};

/**
 * 気象情報を取得します。
 * @param coord 座標
 * @param units 単位
 * @returns 気象情報
 */
const getWeatherForecast = async (coord: Coordinate, units: 'metric' | 'imperial') => {
  const client = createInstance();
  const response = await client.get<OpenWeatherMapApiResponse>(
    `${constants.url.getWeatherForecast}&lat=${coord.lat}&lon=${coord.lon}&units=${units}&lang=ja`
  );
  if (response.data.cod !== '200') throw new Error(response.data.message);

  const forecasts: Forecast[] = [];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  response.data.list!.map((record) => {
    forecasts.push({
      date: new Date(record.dt_txt),
      group: getWeatherGroup(record.weather[0].id),
      summary: record.weather[0].main,
      description: record.weather[0].description,
      temperature: record.main.temp,
      wind: record.wind.speed,
      iconUrl: `${constants.url.getWeatherIcon}${record.weather[0].icon}@2x.png`,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const city = response.data.city!;
  return {
    city: city.name,
    country: city.country,
    lat: city.coord.lat,
    lon: city.coord.lon,
    forecasts: forecasts,
  } as Weather;
};

export const useWeatherForecast = (coord: Coordinate) => {
  const [buffer, setBuffer] = useState<Weather>();

  useEffect(() => {
    const func = async () => {
      try {
        const tmp = await getWeatherForecast(coord, 'metric');
        setBuffer(tmp);
      } catch (err) {
        handleError(err);
      }
    };

    func();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coord]);

  return buffer;
};
