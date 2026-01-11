import { getElectronApi } from '../../utils';

let api = getElectronApi();

/**
 * Normlize a path in UI side use whenver you need to normalize a path to be consistent throughout UI usage
 * @param path The file path
 * @returns Path
 */
export async function flufNormalize(path: string) {
  return (await api.pathApi.normalize(path)).toLowerCase();
}
