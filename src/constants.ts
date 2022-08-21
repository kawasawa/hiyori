export const constants = {
  meta: {
    title: 'ひより',
    author: 'Kazuki Awasawa',
    copyright: `© Kazuki Awasawa All Rights Reserved.`,
  },
  url: {
    getWeatherForecast: `https://api.openweathermap.org/data/2.5/forecast?appid=${process.env.REACT_APP_OPEN_WEATHER_MAP_API_KEY}`,
    getWeatherIcon: 'https://openweathermap.org/img/wn/',
  },
};
