/**
 * Util to get the electron api
 * @returns Electron api
 */
export function getElectronApi(): ElectronApi {
  return (window as unknown as EWindow).electronApi;
}
