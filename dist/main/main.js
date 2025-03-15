/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/main/main.ts":
/*!**************************!*\
  !*** ./src/main/main.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

eval("\r\nvar __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {\r\n    if (k2 === undefined) k2 = k;\r\n    var desc = Object.getOwnPropertyDescriptor(m, k);\r\n    if (!desc || (\"get\" in desc ? !m.__esModule : desc.writable || desc.configurable)) {\r\n      desc = { enumerable: true, get: function() { return m[k]; } };\r\n    }\r\n    Object.defineProperty(o, k2, desc);\r\n}) : (function(o, m, k, k2) {\r\n    if (k2 === undefined) k2 = k;\r\n    o[k2] = m[k];\r\n}));\r\nvar __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {\r\n    Object.defineProperty(o, \"default\", { enumerable: true, value: v });\r\n}) : function(o, v) {\r\n    o[\"default\"] = v;\r\n});\r\nvar __importStar = (this && this.__importStar) || function (mod) {\r\n    if (mod && mod.__esModule) return mod;\r\n    var result = {};\r\n    if (mod != null) for (var k in mod) if (k !== \"default\" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);\r\n    __setModuleDefault(result, mod);\r\n    return result;\r\n};\r\nvar __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {\r\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\r\n    return new (P || (P = Promise))(function (resolve, reject) {\r\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\r\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\r\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\r\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\r\n    });\r\n};\r\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\r\nconst electron_1 = __webpack_require__(/*! electron */ \"electron\");\r\nconst path = __importStar(__webpack_require__(/*! path */ \"path\"));\r\nfunction clearCache() {\r\n    return __awaiter(this, void 0, void 0, function* () {\r\n        const ses = electron_1.session.defaultSession;\r\n        try {\r\n            yield ses.clearCache();\r\n            yield ses.clearStorageData({\r\n                storages: ['appcache', 'shadercache', 'cachestorage', 'localstorage', 'cookies']\r\n            });\r\n            console.log('Cache cleared successfully');\r\n        }\r\n        catch (err) {\r\n            console.error('Error clearing cache:', err);\r\n        }\r\n    });\r\n}\r\nfunction createWindow() {\r\n    const mainWindow = new electron_1.BrowserWindow({\r\n        width: 1024,\r\n        height: 768,\r\n        webPreferences: {\r\n            nodeIntegration: true,\r\n            contextIsolation: false\r\n        },\r\n        // Frameless window settings\r\n        frame: false,\r\n        transparent: false,\r\n        backgroundColor: '#f0f7ff',\r\n        title: '🎯 Alphabet Learning Game',\r\n        icon: path.join(__dirname, '../assets/icon.png'),\r\n        fullscreen: true,\r\n        kiosk: true // Prevent leaving fullscreen\r\n    });\r\n    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));\r\n    // Handle window controls\r\n    electron_1.ipcMain.on('window-minimize', () => {\r\n        // Disabled in fullscreen mode\r\n    });\r\n    electron_1.ipcMain.on('window-maximize', () => {\r\n        // Always keep fullscreen\r\n        if (!mainWindow.isFullScreen()) {\r\n            mainWindow.setFullScreen(true);\r\n        }\r\n    });\r\n    electron_1.ipcMain.on('window-close', () => {\r\n        mainWindow.close();\r\n    });\r\n    // Prevent leaving fullscreen\r\n    mainWindow.on('leave-full-screen', () => {\r\n        mainWindow.setFullScreen(true);\r\n    });\r\n}\r\nelectron_1.app.whenReady().then(() => __awaiter(void 0, void 0, void 0, function* () {\r\n    yield clearCache();\r\n    createWindow();\r\n}));\r\nelectron_1.app.on('window-all-closed', () => {\r\n    if (process.platform !== 'darwin') {\r\n        electron_1.app.quit();\r\n    }\r\n});\r\nelectron_1.app.on('activate', () => {\r\n    if (electron_1.BrowserWindow.getAllWindows().length === 0) {\r\n        createWindow();\r\n    }\r\n});\r\nelectron_1.ipcMain.handle('clear-cache', () => __awaiter(void 0, void 0, void 0, function* () {\r\n    yield clearCache();\r\n    return true;\r\n}));\r\n\n\n//# sourceURL=webpack://alphabet-game/./src/main/main.ts?");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("electron");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/main/main.ts");
/******/ 	
/******/ })()
;