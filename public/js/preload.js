'use strict'
const electron = require('electron');
class MockChrome {
  mock(window) {
    this.deleteChromeWebStore();
    if (window.chrome && window.chrome.app) {
      return;
    }
    const Pad = {
      "mockChromeRuntime": `function mockChromeRuntime (window) {\n  if (window.chrome && window.chrome.app) {\n    return window.chrome\n  }\n  /** This could be further improved still (use Proxy and mock behaviour of functions and their errors) */\n  const generateMockChromeRuntime = window => {\n    // eslint-disable-next-line no-unused-vars\n    const installer = {\n      install () {\n        // mocked\n      }\n    }\n    return {\n      app: {\n        isInstalled: false,\n        InstallState: {\n          DISABLED: 'disabled',\n          INSTALLED: 'installed',\n          NOT_INSTALLED: 'not_installed'\n        },\n        RunningState: {\n          CANNOT_RUN: 'cannot_run',\n          READY_TO_RUN: 'ready_to_run',\n          RUNNING: 'running'\n        }\n      },\n      csi () {},\n      loadTimes () {},\n      // webstore: {\n      //   onInstallStageChanged: {},\n      //   onDownloadProgress: {},\n      //   install (url, onSuccess, onFailure) {\n      //     installer.install(url, onSuccess, onFailure)\n      //   }\n      // },\n      runtime: {\n        OnInstalledReason: {\n          CHROME_UPDATE: 'chrome_update',\n          INSTALL: 'install',\n          SHARED_MODULE_UPDATE: 'shared_module_update',\n          UPDATE: 'update'\n        },\n        OnRestartRequiredReason: {\n          APP_UPDATE: 'app_update',\n          OS_UPDATE: 'os_update',\n          PERIODIC: 'periodic'\n        },\n        PlatformArch: {\n          ARM: 'arm',\n          MIPS: 'mips',\n          MIPS64: 'mips64',\n          X86_32: 'x86-32',\n          X86_64: 'x86-64'\n        },\n        PlatformNaclArch: {\n          ARM: 'arm',\n          MIPS: 'mips',\n          MIPS64: 'mips64',\n          X86_32: 'x86-32',\n          X86_64: 'x86-64'\n        },\n        PlatformOs: {\n          ANDROID: 'android',\n          CROS: 'cros',\n          LINUX: 'linux',\n          MAC: 'mac',\n          OPENBSD: 'openbsd',\n          WIN: 'win'\n        },\n        RequestUpdateCheckStatus: {\n          NO_UPDATE: 'no_update',\n          THROTTLED: 'throttled',\n          UPDATE_AVAILABLE: 'update_available'\n        },\n        connect: function () {}.bind(function () {}), // eslint-disable-line\n        sendMessage: function () {}.bind(function () {}) // eslint-disable-line\n      }\n    }\n  }\n  window.chrome = generateMockChromeRuntime(window)\n}`,
      "mockChromePlugins": `/** This could be further improved still (use Proxy and mock behaviour of functions and their errors) */\nfunction mockChromePlugins (window) {\n  /* global MimeType MimeTypeArray PluginArray */\n\n  // Disguise custom functions as being native\n  const makeFnsNative = (fns = []) => {\n    const oldCall = Function.prototype.call\n\n    function call () {\n      return oldCall.apply(this, arguments)\n    }\n    // eslint-disable-next-line\n    Function.prototype.call = call\n\n    const nativeToStringFunctionString = Error.toString().replace(\n      /Error/g,\n      'toString'\n    )\n    const oldToString = Function.prototype.toString\n\n    function functionToString () {\n      for (let i = 0; i < fns.length; i++) {\n        const fn = fns[i]\n        if (this === fn.ref) {\n          return 'function ' + fn.name + '() { [native code] }'\n        }\n      }\n\n      if (this === functionToString) {\n        return nativeToStringFunctionString\n      }\n      return oldCall.call(oldToString, this)\n    }\n    // eslint-disable-next-line\n    Function.prototype.toString = functionToString\n  }\n  const mockedFns = []\n  const fakeData = {\n    mimeTypes: [{\n      type: 'application/pdf',\n      suffixes: 'pdf',\n      description: '',\n      __pluginName: 'Chrome PDF Viewer'\n    },\n    {\n      type: 'application/x-google-chrome-pdf',\n      suffixes: 'pdf',\n      description: 'Portable Document Format',\n      __pluginName: 'Chrome PDF Plugin'\n    },\n    {\n      type: 'application/x-nacl',\n      suffixes: '',\n      description: 'Native Client Executable',\n      enabledPlugin: Plugin,\n      __pluginName: 'Native Client'\n    },\n    {\n      type: 'application/x-pnacl',\n      suffixes: '',\n      description: 'Portable Native Client Executable',\n      __pluginName: 'Native Client'\n    }\n    ],\n    plugins: [{\n      name: 'Chrome PDF Plugin',\n      filename: 'internal-pdf-viewer',\n      description: 'Portable Document Format'\n    },\n    {\n      name: 'Chrome PDF Viewer',\n      filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',\n      description: ''\n    },\n    {\n      name: 'Native Client',\n      filename: 'internal-nacl-plugin',\n      description: ''\n    }\n    ],\n    fns: {\n      namedItem: instanceName => {\n        // Returns the Plugin/MimeType with the specified name.\n        const fn = function (name) {\n          if (!arguments.length) {\n            throw new TypeError(\n              'Failed to execute \\'namedItem\\' on ' + instanceName + ': 1 argument required, but only 0 present.'\n            )\n          }\n          return this[name] || null\n        }\n        mockedFns.push({\n          ref: fn,\n          name: 'namedItem'\n        })\n        return fn\n      },\n      item: instanceName => {\n        // Returns the Plugin/MimeType at the specified index into the array.\n        const fn = function (index) {\n          if (!arguments.length) {\n            throw new TypeError(\n              'Failed to execute \\'namedItem\\' on ' + instanceName + ': 1 argument required, but only 0 present.'\n            )\n          }\n          return this[index] || null\n        }\n        mockedFns.push({\n          ref: fn,\n          name: 'item'\n        })\n        return fn\n      },\n      refresh: instanceName => {\n        // Refreshes all plugins on the current page, optionally reloading documents.\n        const fn = function () {\n          return undefined\n        }\n        mockedFns.push({\n          ref: fn,\n          name: 'refresh'\n        })\n        return fn\n      }\n    }\n  }\n  function mockPluginsAndMimeTypes () {\n    // Poor mans _.pluck\n    const getSubset = (keys, obj) =>\n      keys.reduce((a, c) => ({\n        ...a,\n        [c]: obj[c]\n      }), {})\n\n    function generateMimeTypeArray () {\n      const arr = fakeData.mimeTypes\n        .map(obj => getSubset(['type', 'suffixes', 'description'], obj))\n        .map(obj => Object.setPrototypeOf(obj, MimeType.prototype))\n      arr.forEach(obj => {\n        arr[obj.type] = obj\n      })\n\n      // Mock functions\n      arr.namedItem = fakeData.fns.namedItem('MimeTypeArray')\n      arr.item = fakeData.fns.item('MimeTypeArray')\n\n      return Object.setPrototypeOf(arr, MimeTypeArray.prototype)\n    }\n\n    const mimeTypeArray = generateMimeTypeArray()\n    Object.defineProperty(window.navigator, 'mimeTypes', {\n      get: () => mimeTypeArray,\n      enumerable: true\n    })\n\n    PluginArray.prototype.toJSON = function () {\n      const dict = {}\n      for (let i = 0; i < this.length; i++) {\n        dict[i] = this[i]\n      }\n      return dict\n    }\n    Plugin.prototype.toJSON = function () {\n      const result = {}\n      for (let i = 0; i < this.length; i++) {\n        result[i] = {}\n      }\n      return result\n    }\n\n    function generatePluginArray () {\n      const arr = fakeData.plugins\n        .map(obj => getSubset(['name', 'filename', 'description'], obj))\n        .map(obj => {\n          const mimes = fakeData.mimeTypes.filter(\n            m => m.__pluginName === obj.name\n          )\n          // Add mimetypes\n          mimes.forEach((mime, index) => {\n            Object.defineProperty(navigator.mimeTypes[mime.type], 'enabledPlugin', {\n              get: () => obj\n            })\n            // navigator.mimeTypes[mime.type].enabledPlugin = obj\n            obj[mime.type] = window.navigator.mimeTypes[mime.type]\n            obj[index] = window.navigator.mimeTypes[mime.type]\n          })\n          obj.length = mimes.length\n          return obj\n        })\n        .map(obj => {\n          // Mock functions\n          obj.namedItem = fakeData.fns.namedItem('Plugin')\n          obj.item = fakeData.fns.item('Plugin')\n          return obj\n        })\n        .map(obj => Object.setPrototypeOf(obj, Plugin.prototype))\n      arr.forEach(obj => {\n        arr[obj.name] = obj\n      })\n\n      // Mock functions\n      arr.namedItem = fakeData.fns.namedItem('PluginArray')\n      arr.item = fakeData.fns.item('PluginArray')\n      arr.refresh = fakeData.fns.refresh('PluginArray')\n\n      return Object.setPrototypeOf(arr, PluginArray.prototype)\n    }\n\n    const pluginArray = generatePluginArray()\n    Object.defineProperty(window.navigator, 'plugins', {\n      get: () => pluginArray,\n      enumerable: true\n    })\n\n    // Make mockedFns toString() representation resemble a native function\n    makeFnsNative(mockedFns)\n  }\n  try {\n    const isPluginArray = window.navigator.plugins instanceof PluginArray\n    const hasPlugins = isPluginArray && window.navigator.plugins.length > 0\n    if (isPluginArray && hasPlugins) {\n      return // nothing to do here\n    }\n    mockPluginsAndMimeTypes()\n  } catch (err) {\n    console.log(err)\n  }\n}`,
      "mockNavigatorPermissions": `function mockNavigatorPermissions(window) {\n  if (window.chrome) {\n    return\n  }\n\n  // ['geolocation', 'notifications', 'push', 'midi', 'camera', 'microphone', 'speaker', 'device-info', 'background-sync', 'bluetooth', 'persistent-storage', 'ambient-light-sensor', 'accelerometer', 'gyroscope', 'magnetometer', 'clipboard', 'accessibility-events', 'clipboard-read', 'clipboard-write', 'payment-handler']\n  // 11321144241322243122\n  // 'prompt': 1, 'granted': 2, 'denied': 0, other: 5\n  const result = {\n    geolocation: 'prompt',\n    notifications: 'prompt',\n    push: new DOMException('Failed to execute \\'query\\' on \\'Permissions\\': Push Permission without userVisibleOnly:true isn\\'t supported yet.'),\n    midi: 'granted',\n    camera: 'prompt',\n    microphone: 'prompt',\n    speaker: new TypeError('Failed to execute \\'query\\' on \\'Permissions\\': The provided value \\'speaker\\' is not a valid enum value of type PermissionName.'),\n    'device-info': new TypeError('Failed to execute \\'query\\' on \\'Permissions\\': The provided value \\'device-info\\' is not a valid enum value of type PermissionName.'),\n    'background-sync': 'granted',\n    bluetooth: new TypeError('Failed to execute \\'query\\' on \\'Permissions\\': The provided value \\'bluetooth\\' is not a valid enum value of type PermissionName.'),\n    'persistent-storage': 'prompt',\n    'ambient-light-sensor': new TypeError('Failed to execute \\'query\\' on \\'Permissions\\': GenericSensorExtraClasses flag is not enabled.'),\n    accelerometer: 'granted',\n    gyroscope: 'granted',\n    magnetometer: 'granted',\n    clipboard: new TypeError('Failed to execute \\'query\\' on \\'Permissions\\': The provided value \\'clipboard\\' is not a valid enum value of type PermissionName.'),\n    'accessibility': new TypeError(\"Failed to execute 'query' on 'Permissions': The provided value 'accessibility' is not a valid enum value of type PermissionName.\"),\n    'accessibility-events': new TypeError('Failed to execute \\'query\\' on \\'Permissions\\': Accessibility Object Model is not enabled.'),\n    'clipboard-read': 'prompt',\n    'clipboard-write': 'granted',\n    'payment-handler': 'granted'\n  }\n  const originalQuery = window.navigator.permissions.query\n  // eslint-disable-next-line\n  window.navigator.permissions.__proto__.query = parameters => {\n    result[parameters.name] ?\n    (result[parameters.name] instanceof Error ?\n      Promise.reject(result[parameters.name]) :\n      Promise.resolve({\n        state: result[parameters.name],\n        onchange: null,\n        __proto__: PermissionStatus.prototype\n      })) :\n    originalQuery(parameters)\n  }\n\n  window.navigator.__proto__.getBattery = () =>\n    Promise.resolve({\n      charging: true,\n      chargingTime: 0,\n      dischargingTime: Infinity,\n      level: 1,\n      onchargingchange: null,\n      onchargingtimechange: null,\n      ondischargingtimechange: null,\n      onlevelchange: null,\n      __proto__: BatteryManager.prototype\n    })\n\n  // Inspired by: https://github.com/ikarienator/phantomjs_hide_and_seek/blob/master/5.spoofFunctionBind.js\n  const oldCall = Function.prototype.call\n\n  function call () {\n    return oldCall.apply(this, arguments)\n  }\n  // eslint-disable-next-line\n  Function.prototype.call = call\n\n  const nativeToStringFunctionString = Error.toString().replace(\n    /Error/g,\n    'toString'\n  )\n  const oldToString = Function.prototype.toString\n\n  function functionToString () {\n    if (this === window.navigator.permissions.query ||\n        this === window.navigator.__proto__.getBattery) {\n      return 'function query() { [native code] }'\n    }\n\n    if (this === functionToString) {\n      return nativeToStringFunctionString\n    }\n    return oldCall.call(oldToString, this)\n  }\n  // eslint-disable-next-line\n  Function.prototype.toString = functionToString\n}`,
      "mockMediaCodecs": `function mockMediaCodecs(window) {\n  if (window.chrome) {\n    return\n  }\n  try {\n    /**\n     * Input might look funky, we need to normalize it so e.g. whitespace isn't an issue for our spoofing.\n     *\n     * @example\n     * video/webm; codecs=\"vp8, vorbis\"\n     * video/mp4; codecs=\"avc1.42E01E\"\n     * audio/x-m4a;\n     * audio/ogg; codecs=\"vorbis\"\n     * @param {String} arg\n     */\n    const parseInput = arg => {\n      const [mime, codecStr] = arg.trim().split(';')\n      let codecs = []\n      if (codecStr && codecStr.includes('codecs=\"')) {\n        codecs = codecStr\n          .trim()\n          .replace('codecs=\"', '')\n          .replace('\"', '')\n          .trim()\n          .split(',')\n          .filter(x => !!x)\n          .map(x => x.trim())\n      }\n      return {\n        mime,\n        codecStr,\n        codecs\n      }\n    }\n\n    /* global HTMLMediaElement */\n    const canPlayType = {\n      // Make toString() native\n      get (target, key) {\n        if (typeof target[key] === 'function') {\n          return target[key].bind(target)\n        }\n        return Reflect.get(target, key)\n      },\n      // Intercept certain requests\n      apply: function (target, ctx, args) {\n        if (!args || !args.length) {\n          return target.apply(ctx, args)\n        }\n        const {\n          mime,\n          codecs\n        } = parseInput(args[0])\n        // This specific mp4 codec is missing in Chromium\n        if (mime === 'video/mp4') {\n          if (codecs.includes('avc1.42E01E')) {\n            return 'probably'\n          }\n        }\n        // This mimetype is only supported if no codecs are specified\n        if (mime === 'audio/x-m4a' && !codecs.length) {\n          return 'maybe'\n        }\n\n        // This mimetype is only supported if no codecs are specified\n        if (mime === 'audio/aac' && !codecs.length) {\n          return 'probably'\n        }\n        // Everything else as usual\n        return target.apply(ctx, args)\n      }\n    }\n    HTMLMediaElement.prototype.canPlayType = new Proxy(\n      HTMLMediaElement.prototype.canPlayType,\n      canPlayType\n    )\n  } catch (err) {\n  }\n}`,
      "mocNavigatorWebDriver": `function mocNavigatorWebDriver (window) {\n  if (window.navigator.webdriver !== undefined) {\n    delete Object.getPrototypeOf(window.navigator).webdriver\n  }\n}`
    };
    const funcList = ["var _fns = []"];
    for (const [funcName, func] of Object.entries(Pad)) {
      funcList.push(func.toString());
      funcList.push("_fns.push(" + funcName + ")");
    }
    funcList.push("for (var i = 0; i < _fns.length; i++) {");
    funcList.push("  _fns[i](window)");
    funcList.push("}");
    let script = funcList.join("\n");
    script = "(function (window) {\n    " + script + "\n  })(window)";
    electron.webFrame.executeJavaScript(script).then(() => {
    }).catch((e) => {
      console.warn(e);
    });
  };
  deleteChromeWebStore() {
    electron.webFrame.executeJavaScript(`(function() {
      var f = function() {
        if (window && window.chrome && window.chrome.webstore) {
          delete window.chrome.webstore;
        }
      }
      f();
      setTimeout(f, 0)
    })()`).then(() => {
    }).catch((e) => {
      console.warn(e);
    });
  }
}
const mock = new MockChrome();
mock.mock(window);
window.document.addEventListener("DOMContentLoaded", () => {
  mock.deleteChromeWebStore();
});
