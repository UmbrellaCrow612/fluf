/**
 * Method to read a file's content - in main world you dont need to worry about event arg thats just a electron main process thing you dont need to pass it
 * simpley ignore it and pass any other args after it
 */
type readFile = (event?: Electron.IpcMainInvokeEvent | undefined, filePath: string) => Promise<string>;
/**
 * API's we expose in the render process to use the electron funcs
 */
type ElectronApi = {
    /**
     * - The function used to format text.
     */
    readFile: readFile;
};
/**
 * Extends window and offers the electron api
 */
type EWindow = {
    /**
     * - The electron api attached
     */
    electronApi: ElectronApi;
};
