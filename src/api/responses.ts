export type OpenWeatherMapApiResponse = {
  cod: string;
  message: string;
  cnt?: number;
  list?: {
    dt: number;
    main: {
      /** 温度 */
      temp: number;
      /** 体感温度 */
      feels_like: number;
      /** 温度 */
      temp_min: number;
      /** 温度 */
      temp_max: number;
      /** 気圧 */
      pressure: number;
      /** 海面気圧 */
      sea_level: number;
      /** 地上気圧 */
      grnd_level: number;
      /** 湿度 */
      humidity: number;
    };
    weather: {
      id: number;
      main: string;
      description: string;
      icon: string;
    }[];
    visibility: number;
    wind: {
      speed: number;
      deg: number;
      gust: number;
    };
    clouds: {
      all: number;
    };
    rain?: {
      '3h': number;
    };
    snow?: {
      '3h': number;
    };
    sys: {
      pod: string;
    };
    pop: number;
    dt_txt: string;
  }[];
  city?: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    sunrise: number;
    sunset: number;
  };
};
