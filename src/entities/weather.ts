export type UnitLength =
  | 'metric' // メートル法
  | 'imperial'; // ヤード法

export type WeatherType =
  | 'Thunderstorm'
  | 'Drizzle'
  | 'Rain'
  | 'HeavyRain'
  | 'Snow'
  | 'Atmosphere'
  | 'Clear'
  | 'FewClear'
  | 'FewClouds'
  | 'Clouds'
  | 'DeepClouds';

export type Coordinate = {
  /** 緯度 */
  lat: number;
  /** 経度 */
  lng: number;
};

export type Weather = {
  /** 日時 */
  date: Date;
  /** 天気の種類 */
  type: WeatherType;
  /** 気温 */
  temperature: number;
  /** 体感温度 */
  selfTemperature: number;
  /** 湿度 */
  humidity: number;
  /** 気圧 */
  pressure: number;
  /** 視界 */
  visibility: number;
  /** 風速 */
  windSpeed: number;
  /** 風向 */
  windDegree: number;
};

export type Forecast = {
  /** 国 */
  country: string;
  /** 都市 */
  city: string;
  /** 天気 */
  weathers: Weather[];
} & Coordinate;
