/**
 * File contains all our impl of electron api funcs to be exposed in the electron api to render
 */

const fs = require("fs");

/**
 * List of watchers active by key directory path and value the watcher
 * @type {Map<string, import("fs").FSWatcher>}
 */
const watchersStore = new Map();

/** @type {import("./type").watchDirectory} */
const watchDirectoryImpl = async (_event = undefined, dirPath) => {
  if (!fs.existsSync(dirPath)) return false;

  if (watchersStore.has(dirPath)) return true;

  const watcher = fs.watch(
    dirPath,
    { persistent: true },
    (eventType, filename) => {
      if (filename) {
        /** @type {import("./type").directoryChangedData} */
        let dirChangedData = {
          dirPath,
          eventType,
          filename,
        };
        _event?.sender.send("dir:changed", dirChangedData);
      }
    }
  );

  watchersStore.set(dirPath, watcher);

  return true;
};

/** @type {import("./type").unwatchDirectory} */
const unwatchDirectoryImpl = async (_event = undefined, dp) => {
  const watcher = watchersStore.get(dp);
  if (watcher) {
    watcher.close();
    watchersStore.delete(dp);
    return true;
  }
  return false;
};

const cleanUpWatchers = () => {
  Array.from(watchersStore.entries()).forEach(([dirPath, watcher]) => {
    watcher.close();
    watchersStore.delete(dirPath);
  });
};

module.exports = {
  watchDirectoryImpl,
  unwatchDirectoryImpl,
  cleanUpWatchers,
};
