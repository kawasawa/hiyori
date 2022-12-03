import { TFunction } from 'react-i18next';

import iconCloudy from '../assets/weatherIcon/cloudy.png';
import iconCloudyDeeply from '../assets/weatherIcon/cloudy-deeply.png';
import iconDay from '../assets/weatherIcon/day.png';
import iconDayCloudy from '../assets/weatherIcon/day-cloudy.png';
import iconFoggy from '../assets/weatherIcon/foggy.png';
import iconNight from '../assets/weatherIcon/night.png';
import iconNightCloudy from '../assets/weatherIcon/night-cloudy.png';
import iconRainy from '../assets/weatherIcon/rainy.png';
import iconRainyHeavy from '../assets/weatherIcon/rainy-heavy.png';
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
import { Forecast } from '../hooks';

export const inDayTime = (date: Date) => 6 <= date.getHours() && date.getHours() <= 18;

// eslint-disable-next-line complexity
export const getWeatherImage = (forecast: Forecast) => {
  switch (forecast.group) {
    case 'Thunderstorm':
      return imageStormy;
    case 'Drizzle':
      return imageRainy;
    case 'Rain':
    case 'HeavyRain':
      return imageRainy;
    case 'Snow':
      return imageSnowy;
    case 'Atmosphere':
      return imageFoggy;
    case 'FewClouds':
      return inDayTime(forecast.date) ? imageDayCloudy : imageNightCloudy;
    case 'Clouds':
    case 'DeepClouds':
      return imageCloudy;
    case 'Clear':
    case 'FewClear':
    default:
      return inDayTime(forecast.date) ? imageDay : imageNight;
  }
};

// eslint-disable-next-line complexity
export const getWeatherIcon = (forecast: Forecast) => {
  switch (forecast.group) {
    case 'Thunderstorm':
      return iconStormy;
    case 'Drizzle':
    case 'Rain':
      return iconRainy;
    case 'HeavyRain':
      return iconRainyHeavy;
    case 'Snow':
      return iconSnowy;
    case 'Atmosphere':
      return iconFoggy;
    case 'FewClouds':
      return inDayTime(forecast.date) ? iconDayCloudy : iconNightCloudy;
    case 'Clouds':
      return iconCloudy;
    case 'DeepClouds':
      return iconCloudyDeeply;
    case 'Clear':
    case 'FewClear':
    default:
      return inDayTime(forecast.date) ? iconDay : iconNight;
  }
};

// eslint-disable-next-line complexity
export const getWeatherName = (forecast: Forecast, t: TFunction<'translation', undefined>) => {
  switch (forecast.group) {
    case 'Thunderstorm':
    case 'Drizzle':
    case 'Rain':
    case 'Snow':
    case 'Atmosphere':
    case 'FewClear':
    case 'Clouds':
    case 'Clear':
      return t(`label.weatherForecast__name--${forecast.group}`);
    case 'HeavyRain':
      return t('label.weatherForecast__name--Rain');
    case 'DeepClouds':
      return t('label.weatherForecast__name--Clouds');
    case 'FewClouds':
      return t('label.weatherForecast__name--FewClear');
    default:
      return t('label.weatherForecast__name--Clear');
  }
};
