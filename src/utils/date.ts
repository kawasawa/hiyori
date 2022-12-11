export const getDateString = (date: Date) => `${date.getFullYear().toString()}/${getMonthDayString(date)}`;

export const getMonthDayString = (date: Date, separator = '/') =>
  `${(date.getMonth() + 1).toString().padStart(2, '0')}${separator}${date.getDate().toString().padStart(2, '0')}`;

export const getTimeString = (date: Date, separator = ':') =>
  `${date.getHours().toString().padStart(2, '0')}${separator}${date.getMinutes().toString().padStart(2, '0')}`;
