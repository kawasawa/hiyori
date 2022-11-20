/* istanbul ignore file */

export const constants = {
  meta: {
    title: 'ひより',
    author: 'Kazuki Awasawa',
    copyright: `© Kazuki Awasawa All Rights Reserved.`,
  },
  url: {
    homepage: 'https://kawasawa.github.io',
    repository: 'https://github.com/kawasawa/hiyori',
    getWeatherForecast: `https://api.openweathermap.org/data/2.5/forecast?appid=${process.env.REACT_APP_OPEN_WEATHER_MAP_API_KEY}`,
    getWeatherIcon: 'https://openweathermap.org/img/wn/',
  },
};
