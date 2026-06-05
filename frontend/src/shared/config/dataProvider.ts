export type DataProvider = 'backend' | 'adafruit';

const configuredProvider = import.meta.env.VITE_DATA_PROVIDER?.toLowerCase();

export const dataProvider: DataProvider =
  configuredProvider === 'adafruit' ? 'adafruit' : 'backend';

export const useAdafruitProvider = dataProvider === 'adafruit';
