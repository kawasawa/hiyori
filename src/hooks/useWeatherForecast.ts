import { useEffect, useState } from 'react';

import { createInstance } from '../api/axios';
import { OpenWeatherMapApiResponse } from '../api/responses';
import { constants } from '../constants';
import { Coordinate, Forecast, UnitLength, Weather, WeatherType } from '../entities/weather';
import { handleError } from '../utils/errors';

/**
 * OpenWeatherMapApi から返却される文字列で表現された UTC 日時を Date 型の JST 日時に変換します。
 * @param apiDateString 文字列型の日時
 * @returns Date 型の日時
 */
const convertApiDateToJSTDate = (apiDateString: string): Date => {
  const date = new Date(apiDateString.replaceAll('-', '/'));
  date.setTime(date.getTime() + 1000 * 60 * 60 * 9); // JST として扱う
  return date;
};

/**
 * WeatherGroup を推定します。
 *
 * WeatherGroup の仕様は下記を参照
 * https://openweathermap.org/weather-conditions#Weather-Condition-Codes-2
 * @param weatherId WeatherID
 * @returns WeatherGroup
 */
// eslint-disable-next-line complexity
const getWeatherType = (weatherId: number): WeatherType => {
  if (804 <= weatherId) return 'DeepClouds'; // 雲量85%以上をくもりと定義する
  if (803 <= weatherId) return 'Clouds'; // 雲量51%-84%をくもりと定義する
  if (802 <= weatherId) return 'FewClouds'; // 雲量25%-50%を晴れと定義する
  if (801 <= weatherId) return 'FewClear'; // 雲量11%-25%を晴れと定義する
  if (800 === weatherId) return 'Clear'; // 雲量10%以下を快晴と定義する
  if (700 <= weatherId) return 'Atmosphere';
  if (600 <= weatherId) return 'Snow';
  if ([502, 503, 504, 522, 531].includes(weatherId)) return 'HeavyRain'; // 一部の雨を豪雨と定義する
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
const getForecasts = async (coord: Coordinate, units: UnitLength) => {
  const client = createInstance();
  const response = await client.get<OpenWeatherMapApiResponse>(
    `${constants.url.getForecast}&lat=${coord.lat}&lon=${coord.lng}&units=${units}&lang=ja`
  );
  if (response.data.cod !== '200' || !response.data.city || !response.data.list) throw new Error(response.data.message);

  // 地点情報を取得する
  const city = response.data.city;

  // 気象情報を取得する
  const weathers = [
    ...response.data.list.map(
      (record) =>
        ({
          date: convertApiDateToJSTDate(record.dt_txt),
          type: getWeatherType(record.weather[0].id),
          temperature: Math.round(record.main.temp),
          selfTemperature: Math.round(record.main.feels_like),
          humidity: record.main.humidity,
          pressure: record.main.pressure,
          visibility: record.visibility,
          windSpeed: Math.round(record.wind.speed),
          windDegree: Math.round(record.wind.deg),
        } as Weather)
    ),
  ];

  return {
    country: city.country,
    city: city.name,
    lat: city.coord.lat,
    lng: city.coord.lon,
    weathers: weathers,
  } as Forecast;
};

/**
 * 気象情報を取得するカスタムフックを定義します。
 * @param coord 座標
 * @returns 気象情報
 */
export const useWeatherForecast = (coord?: Coordinate) => {
  const [buffer, setBuffer] = useState<Forecast>();

  useEffect(() => {
    const func = async (coord: Coordinate) => {
      try {
        const tmp = await getForecasts(coord, 'metric');
        setBuffer(tmp);
      } catch (err) {
        handleError(err);
      }
    };

    if (coord) func(coord);
  }, [coord]);

  return buffer;
};
