import { installBrowserRuntime } from "./install-browser-runtime.js";
import { installReactHelpers } from "../shared/presentation/react-helpers.js";
import { installBrowserFiles } from "../shared/presentation/browser-files.js";
// Temporary entry adapter. New features must use explicit dependencies, not window.
installBrowserRuntime(window);
installReactHelpers(window, window.React, window.ReactDOM);
installBrowserFiles(window);
