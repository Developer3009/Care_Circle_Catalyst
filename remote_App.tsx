import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/App.tsx");const _jsxDEV = __vite__cjsImport19_react_jsxDevRuntime["jsxDEV"]; const _Fragment = __vite__cjsImport19_react_jsxDevRuntime["Fragment"];import { Routes, Route, Navigate } from "/node_modules/.vite/deps/react-router-dom.js?v=0cd69c2d";
import { Toaster } from "/src/components/ui/sonner.tsx";
import Landing from "/src/pages/Landing.tsx";
import Login from "/src/pages/Login.tsx";
import Register from "/src/pages/Register.tsx";
import Join from "/src/pages/Join.tsx";
import AppShell from "/src/components/AppShell.tsx";
import TodayDashboard from "/src/pages/TodayDashboard.tsx";
import ElderToday from "/src/pages/ElderToday.tsx";
import Medications from "/src/pages/Medications.tsx";
import CalendarView from "/src/pages/CalendarView.tsx";
import Appointments from "/src/pages/Appointments.tsx";
import HealthLog from "/src/pages/HealthLog.tsx";
import AdherenceReports from "/src/pages/AdherenceReports.tsx";
import ConsentCenter from "/src/pages/ConsentCenter.tsx";
import EmergencyCardPage from "/src/pages/EmergencyCard.tsx";
import SettingsPage from "/src/pages/SettingsPage.tsx";
import EmailDoseAction from "/src/pages/EmailDoseAction.tsx";
import EmergencyPublic from "/src/pages/EmergencyPublic.tsx";
var _jsxFileName = "/app/frontend/src/App.tsx";
import __vite__cjsImport19_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=0cd69c2d";
// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
	return /* @__PURE__ */ _jsxDEV(_Fragment, { children: [/* @__PURE__ */ _jsxDEV(Routes, { children: [
		/* @__PURE__ */ _jsxDEV(Route, {
			path: "/",
			element: /* @__PURE__ */ _jsxDEV(Landing, {
				"x-file-name": "App",
				"x-line-number": "26",
				"x-column": "33",
				"x-component": "Landing",
				"x-id": "App_26_33",
				"x-dynamic": "true"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 25,
				columnNumber: 34
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 25,
			columnNumber: 9
		}, this),
		/* @__PURE__ */ _jsxDEV(Route, {
			path: "/login",
			element: /* @__PURE__ */ _jsxDEV(Login, {
				"x-file-name": "App",
				"x-line-number": "27",
				"x-column": "38",
				"x-component": "Login",
				"x-id": "App_27_38",
				"x-dynamic": "true"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 26,
				columnNumber: 39
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 26,
			columnNumber: 9
		}, this),
		/* @__PURE__ */ _jsxDEV(Route, {
			path: "/register",
			element: /* @__PURE__ */ _jsxDEV(Register, {
				"x-file-name": "App",
				"x-line-number": "28",
				"x-column": "41",
				"x-component": "Register",
				"x-id": "App_28_41",
				"x-dynamic": "true"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 27,
				columnNumber: 42
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 27,
			columnNumber: 9
		}, this),
		/* @__PURE__ */ _jsxDEV(Route, {
			path: "/join",
			element: /* @__PURE__ */ _jsxDEV(Join, {
				"x-file-name": "App",
				"x-line-number": "29",
				"x-column": "37",
				"x-component": "Join",
				"x-id": "App_29_37",
				"x-dynamic": "true",
				"x-excluded": "true"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 28,
				columnNumber: 38
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 28,
			columnNumber: 9
		}, this),
		/* @__PURE__ */ _jsxDEV(Route, {
			path: "/e/:token",
			element: /* @__PURE__ */ _jsxDEV(EmailDoseAction, {
				"x-file-name": "App",
				"x-line-number": "30",
				"x-column": "41",
				"x-component": "EmailDoseAction",
				"x-id": "App_30_41",
				"x-dynamic": "true"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 29,
				columnNumber: 42
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 29,
			columnNumber: 9
		}, this),
		/* @__PURE__ */ _jsxDEV(Route, {
			path: "/sos/:token",
			element: /* @__PURE__ */ _jsxDEV(EmergencyPublic, {
				"x-file-name": "App",
				"x-line-number": "31",
				"x-column": "43",
				"x-component": "EmergencyPublic",
				"x-id": "App_31_43",
				"x-dynamic": "true"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 30,
				columnNumber: 44
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 30,
			columnNumber: 9
		}, this),
		/* @__PURE__ */ _jsxDEV(Route, {
			path: "/app",
			element: /* @__PURE__ */ _jsxDEV(AppShell, {
				"x-file-name": "App",
				"x-line-number": "32",
				"x-column": "36",
				"x-component": "AppShell",
				"x-id": "App_32_36",
				"x-dynamic": "true",
				"x-excluded": "true"
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 31,
				columnNumber: 37
			}, this),
			children: [
				/* @__PURE__ */ _jsxDEV(Route, {
					index: true,
					element: /* @__PURE__ */ _jsxDEV(TodayDashboard, {
						"x-file-name": "App",
						"x-line-number": "33",
						"x-column": "32",
						"x-component": "TodayDashboard",
						"x-id": "App_33_32",
						"x-dynamic": "true"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 32,
						columnNumber: 33
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 32,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "elder",
					element: /* @__PURE__ */ _jsxDEV(ElderToday, {
						"x-file-name": "App",
						"x-line-number": "34",
						"x-column": "39",
						"x-component": "ElderToday",
						"x-id": "App_34_39",
						"x-dynamic": "true"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 33,
						columnNumber: 40
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 33,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "medications",
					element: /* @__PURE__ */ _jsxDEV(Medications, {
						"x-file-name": "App",
						"x-line-number": "35",
						"x-column": "45",
						"x-component": "Medications",
						"x-id": "App_35_45",
						"x-dynamic": "true",
						"x-excluded": "true"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 34,
						columnNumber: 46
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 34,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "calendar",
					element: /* @__PURE__ */ _jsxDEV(CalendarView, {
						"x-file-name": "App",
						"x-line-number": "36",
						"x-column": "42",
						"x-component": "CalendarView",
						"x-id": "App_36_42",
						"x-dynamic": "true"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 35,
						columnNumber: 43
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 35,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "appointments",
					element: /* @__PURE__ */ _jsxDEV(Appointments, {
						"x-file-name": "App",
						"x-line-number": "37",
						"x-column": "46",
						"x-component": "Appointments",
						"x-id": "App_37_46",
						"x-dynamic": "true",
						"x-excluded": "true"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 36,
						columnNumber: 47
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 36,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "health",
					element: /* @__PURE__ */ _jsxDEV(HealthLog, {
						"x-file-name": "App",
						"x-line-number": "38",
						"x-column": "40",
						"x-component": "HealthLog",
						"x-id": "App_38_40",
						"x-dynamic": "true",
						"x-excluded": "true"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 37,
						columnNumber: 41
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 37,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "reports",
					element: /* @__PURE__ */ _jsxDEV(AdherenceReports, {
						"x-file-name": "App",
						"x-line-number": "39",
						"x-column": "41",
						"x-component": "AdherenceReports",
						"x-id": "App_39_41",
						"x-dynamic": "true",
						"x-excluded": "true"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 38,
						columnNumber: 42
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 38,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "members",
					element: /* @__PURE__ */ _jsxDEV(ConsentCenter, {
						"x-file-name": "App",
						"x-line-number": "40",
						"x-column": "41",
						"x-component": "ConsentCenter",
						"x-id": "App_40_41",
						"x-dynamic": "true",
						"x-excluded": "true"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 39,
						columnNumber: 42
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 39,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "emergency",
					element: /* @__PURE__ */ _jsxDEV(EmergencyCardPage, {
						"x-file-name": "App",
						"x-line-number": "41",
						"x-column": "43",
						"x-component": "EmergencyCardPage",
						"x-id": "App_41_43",
						"x-dynamic": "true"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 40,
						columnNumber: 44
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 40,
					columnNumber: 11
				}, this),
				/* @__PURE__ */ _jsxDEV(Route, {
					path: "settings",
					element: /* @__PURE__ */ _jsxDEV(SettingsPage, {
						"x-file-name": "App",
						"x-line-number": "42",
						"x-column": "42",
						"x-component": "SettingsPage",
						"x-id": "App_42_42",
						"x-dynamic": "true",
						"x-excluded": "true"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 41,
						columnNumber: 43
					}, this)
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 41,
					columnNumber: 11
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 31,
			columnNumber: 9
		}, this),
		/* @__PURE__ */ _jsxDEV(Route, {
			path: "*",
			element: /* @__PURE__ */ _jsxDEV(Navigate, {
				to: "/",
				replace: true
			}, void 0, false, {
				fileName: _jsxFileName,
				lineNumber: 43,
				columnNumber: 34
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 43,
			columnNumber: 9
		}, this)
	] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 24,
		columnNumber: 7
	}, this), /* @__PURE__ */ _jsxDEV(Toaster, {
		richColors: true,
		position: "bottom-right",
		"x-file-name": "App",
		"x-line-number": "46",
		"x-column": "6",
		"x-component": "Toaster",
		"x-id": "App_46_6",
		"x-dynamic": "true"
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 45,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName,
		lineNumber: 23,
		columnNumber: 10
	}, this);
}
_c = App;
var _c;
$RefreshReg$(_c, "App");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
import * as __vite_react_currentExports from "/src/App.tsx";
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }

  const currentExports = __vite_react_currentExports;
  queueMicrotask(() => {
    RefreshRuntime.registerExportsForReactRefresh("/app/frontend/src/App.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("/app/frontend/src/App.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) { return RefreshRuntime.register(type, "/app/frontend/src/App.tsx" + ' ' + id); }
function $RefreshSig$() { return RefreshRuntime.createSignatureFunctionForTransform(); }

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6IkFBQUEsU0FBU0EsUUFBUUMsT0FBT0MsZ0JBQWdCO0FBQ3hDLFNBQVNDLGVBQWU7QUFDeEIsT0FBT0MsYUFBYTtBQUNwQixPQUFPQyxXQUFXO0FBQ2xCLE9BQU9DLGNBQWM7QUFDckIsT0FBT0MsVUFBVTtBQUNqQixPQUFPQyxjQUFjO0FBQ3JCLE9BQU9DLG9CQUFvQjtBQUMzQixPQUFPQyxnQkFBZ0I7QUFDdkIsT0FBT0MsaUJBQWlCO0FBQ3hCLE9BQU9DLGtCQUFrQjtBQUN6QixPQUFPQyxrQkFBa0I7QUFDekIsT0FBT0MsZUFBZTtBQUN0QixPQUFPQyxzQkFBc0I7QUFDN0IsT0FBT0MsbUJBQW1CO0FBQzFCLE9BQU9DLHVCQUF1QjtBQUM5QixPQUFPQyxrQkFBa0I7QUFDekIsT0FBT0MscUJBQXFCO0FBQzVCLE9BQU9DLHFCQUFxQjs7OztBQUc1QixlQUFlLFNBQVNDLE1BQU07Q0FDNUIsT0FDRSxnREFDRSx3QkFBQyxRQUFEO0VBQ0Usd0JBQUMsT0FBRDtHQUFPLE1BQUs7R0FBSSxTQUFTLHdCQUFDLFNBQUQ7SUFBUTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7R0FBQTs7Ozs7RUFBSTs7Ozs7RUFDckMsd0JBQUMsT0FBRDtHQUFPLE1BQUs7R0FBUyxTQUFTLHdCQUFDLE9BQUQ7SUFBTTtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7R0FBQTs7Ozs7RUFBSTs7Ozs7RUFDeEMsd0JBQUMsT0FBRDtHQUFPLE1BQUs7R0FBWSxTQUFTLHdCQUFDLFVBQUQ7SUFBUztJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7R0FBQTs7Ozs7RUFBSTs7Ozs7RUFDOUMsd0JBQUMsT0FBRDtHQUFPLE1BQUs7R0FBUSxTQUFTLHdCQUFDLE1BQUQ7SUFBSztJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtHQUFBOzs7OztFQUFJOzs7OztFQUN0Qyx3QkFBQyxPQUFEO0dBQU8sTUFBSztHQUFZLFNBQVMsd0JBQUMsaUJBQUQ7SUFBZ0I7SUFBQTtJQUFBO0lBQUE7SUFBQTtJQUFBO0dBQUE7Ozs7O0VBQUk7Ozs7O0VBQ3JELHdCQUFDLE9BQUQ7R0FBTyxNQUFLO0dBQWMsU0FBUyx3QkFBQyxpQkFBRDtJQUFnQjtJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7R0FBQTs7Ozs7RUFBSTs7Ozs7RUFDdkQsd0JBQUMsT0FBRDtHQUFPLE1BQUs7R0FBTyxTQUFTLHdCQUFDLFVBQUQ7SUFBUztJQUFBO0lBQUE7SUFBQTtJQUFBO0lBQUE7SUFBQTtHQUFBOzs7OzthQUFyQztJQUNFLHdCQUFDLE9BQUQ7S0FBTztLQUFNLFNBQVMsd0JBQUMsZ0JBQUQ7TUFBZTtNQUFBO01BQUE7TUFBQTtNQUFBO01BQUE7S0FBQTs7Ozs7SUFBSTs7Ozs7SUFDekMsd0JBQUMsT0FBRDtLQUFPLE1BQUs7S0FBUSxTQUFTLHdCQUFDLFlBQUQ7TUFBVztNQUFBO01BQUE7TUFBQTtNQUFBO01BQUE7S0FBQTs7Ozs7SUFBSTs7Ozs7SUFDNUMsd0JBQUMsT0FBRDtLQUFPLE1BQUs7S0FBYyxTQUFTLHdCQUFDLGFBQUQ7TUFBWTtNQUFBO01BQUE7TUFBQTtNQUFBO01BQUE7TUFBQTtLQUFBOzs7OztJQUFJOzs7OztJQUNuRCx3QkFBQyxPQUFEO0tBQU8sTUFBSztLQUFXLFNBQVMsd0JBQUMsY0FBRDtNQUFhO01BQUE7TUFBQTtNQUFBO01BQUE7TUFBQTtLQUFBOzs7OztJQUFJOzs7OztJQUNqRCx3QkFBQyxPQUFEO0tBQU8sTUFBSztLQUFlLFNBQVMsd0JBQUMsY0FBRDtNQUFhO01BQUE7TUFBQTtNQUFBO01BQUE7TUFBQTtNQUFBO0tBQUE7Ozs7O0lBQUk7Ozs7O0lBQ3JELHdCQUFDLE9BQUQ7S0FBTyxNQUFLO0tBQVMsU0FBUyx3QkFBQyxXQUFEO01BQVU7TUFBQTtNQUFBO01BQUE7TUFBQTtNQUFBO01BQUE7S0FBQTs7Ozs7SUFBSTs7Ozs7SUFDNUMsd0JBQUMsT0FBRDtLQUFPLE1BQUs7S0FBVSxTQUFTLHdCQUFDLGtCQUFEO01BQWlCO01BQUE7TUFBQTtNQUFBO01BQUE7TUFBQTtNQUFBO0tBQUE7Ozs7O0lBQUk7Ozs7O0lBQ3BELHdCQUFDLE9BQUQ7S0FBTyxNQUFLO0tBQVUsU0FBUyx3QkFBQyxlQUFEO01BQWM7TUFBQTtNQUFBO01BQUE7TUFBQTtNQUFBO01BQUE7S0FBQTs7Ozs7SUFBSTs7Ozs7SUFDakQsd0JBQUMsT0FBRDtLQUFPLE1BQUs7S0FBWSxTQUFTLHdCQUFDLG1CQUFEO01BQWtCO01BQUE7TUFBQTtNQUFBO01BQUE7TUFBQTtLQUFBOzs7OztJQUFJOzs7OztJQUN2RCx3QkFBQyxPQUFEO0tBQU8sTUFBSztLQUFXLFNBQVMsd0JBQUMsY0FBRDtNQUFhO01BQUE7TUFBQTtNQUFBO01BQUE7TUFBQTtNQUFBO0tBQUE7Ozs7O0lBQUk7Ozs7O0dBQzVDOzs7Ozs7RUFDUCx3QkFBQyxPQUFEO0dBQU8sTUFBSztHQUFJLFNBQVMsd0JBQUMsVUFBRDtJQUFVLElBQUc7SUFBSTtHQUFPOzs7OztFQUFJOzs7OztDQUMvQzs7OztXQUNSLHdCQUFDLFNBQUQ7RUFBUztFQUFXLFVBQVM7RUFBYztFQUFBO0VBQUE7RUFBQTtFQUFBO0VBQUE7Q0FBQTs7OztTQUM3Qzs7Ozs7QUFFSiIsIm5hbWVzIjpbIlJvdXRlcyIsIlJvdXRlIiwiTmF2aWdhdGUiLCJUb2FzdGVyIiwiTGFuZGluZyIsIkxvZ2luIiwiUmVnaXN0ZXIiLCJKb2luIiwiQXBwU2hlbGwiLCJUb2RheURhc2hib2FyZCIsIkVsZGVyVG9kYXkiLCJNZWRpY2F0aW9ucyIsIkNhbGVuZGFyVmlldyIsIkFwcG9pbnRtZW50cyIsIkhlYWx0aExvZyIsIkFkaGVyZW5jZVJlcG9ydHMiLCJDb25zZW50Q2VudGVyIiwiRW1lcmdlbmN5Q2FyZFBhZ2UiLCJTZXR0aW5nc1BhZ2UiLCJFbWFpbERvc2VBY3Rpb24iLCJFbWVyZ2VuY3lQdWJsaWMiLCJBcHAiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiQXBwLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSb3V0ZXMsIFJvdXRlLCBOYXZpZ2F0ZSB9IGZyb20gXCJyZWFjdC1yb3V0ZXItZG9tXCI7XG5pbXBvcnQgeyBUb2FzdGVyIH0gZnJvbSBcIkAvY29tcG9uZW50cy91aS9zb25uZXJcIjtcbmltcG9ydCBMYW5kaW5nIGZyb20gXCJAL3BhZ2VzL0xhbmRpbmdcIjtcbmltcG9ydCBMb2dpbiBmcm9tIFwiQC9wYWdlcy9Mb2dpblwiO1xuaW1wb3J0IFJlZ2lzdGVyIGZyb20gXCJAL3BhZ2VzL1JlZ2lzdGVyXCI7XG5pbXBvcnQgSm9pbiBmcm9tIFwiQC9wYWdlcy9Kb2luXCI7XG5pbXBvcnQgQXBwU2hlbGwgZnJvbSBcIkAvY29tcG9uZW50cy9BcHBTaGVsbFwiO1xuaW1wb3J0IFRvZGF5RGFzaGJvYXJkIGZyb20gXCJAL3BhZ2VzL1RvZGF5RGFzaGJvYXJkXCI7XG5pbXBvcnQgRWxkZXJUb2RheSBmcm9tIFwiQC9wYWdlcy9FbGRlclRvZGF5XCI7XG5pbXBvcnQgTWVkaWNhdGlvbnMgZnJvbSBcIkAvcGFnZXMvTWVkaWNhdGlvbnNcIjtcbmltcG9ydCBDYWxlbmRhclZpZXcgZnJvbSBcIkAvcGFnZXMvQ2FsZW5kYXJWaWV3XCI7XG5pbXBvcnQgQXBwb2ludG1lbnRzIGZyb20gXCJAL3BhZ2VzL0FwcG9pbnRtZW50c1wiO1xuaW1wb3J0IEhlYWx0aExvZyBmcm9tIFwiQC9wYWdlcy9IZWFsdGhMb2dcIjtcbmltcG9ydCBBZGhlcmVuY2VSZXBvcnRzIGZyb20gXCJAL3BhZ2VzL0FkaGVyZW5jZVJlcG9ydHNcIjtcbmltcG9ydCBDb25zZW50Q2VudGVyIGZyb20gXCJAL3BhZ2VzL0NvbnNlbnRDZW50ZXJcIjtcbmltcG9ydCBFbWVyZ2VuY3lDYXJkUGFnZSBmcm9tIFwiQC9wYWdlcy9FbWVyZ2VuY3lDYXJkXCI7XG5pbXBvcnQgU2V0dGluZ3NQYWdlIGZyb20gXCJAL3BhZ2VzL1NldHRpbmdzUGFnZVwiO1xuaW1wb3J0IEVtYWlsRG9zZUFjdGlvbiBmcm9tIFwiQC9wYWdlcy9FbWFpbERvc2VBY3Rpb25cIjtcbmltcG9ydCBFbWVyZ2VuY3lQdWJsaWMgZnJvbSBcIkAvcGFnZXMvRW1lcmdlbmN5UHVibGljXCI7XG5cbi8vIE9uZSA8Um91dGU+IHBlciBwYWdlIGluIHNyYy9wYWdlczsgQnJvd3NlclJvdXRlciBhbHJlYWR5IHdyYXBzIHRoaXMgaW4gbWFpbi50c3guXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBBcHAoKSB7XG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxSb3V0ZXM+XG4gICAgICAgIDxSb3V0ZSBwYXRoPVwiL1wiIGVsZW1lbnQ9ezxMYW5kaW5nIC8+fSAvPlxuICAgICAgICA8Um91dGUgcGF0aD1cIi9sb2dpblwiIGVsZW1lbnQ9ezxMb2dpbiAvPn0gLz5cbiAgICAgICAgPFJvdXRlIHBhdGg9XCIvcmVnaXN0ZXJcIiBlbGVtZW50PXs8UmVnaXN0ZXIgLz59IC8+XG4gICAgICAgIDxSb3V0ZSBwYXRoPVwiL2pvaW5cIiBlbGVtZW50PXs8Sm9pbiAvPn0gLz5cbiAgICAgICAgPFJvdXRlIHBhdGg9XCIvZS86dG9rZW5cIiBlbGVtZW50PXs8RW1haWxEb3NlQWN0aW9uIC8+fSAvPlxuICAgICAgICA8Um91dGUgcGF0aD1cIi9zb3MvOnRva2VuXCIgZWxlbWVudD17PEVtZXJnZW5jeVB1YmxpYyAvPn0gLz5cbiAgICAgICAgPFJvdXRlIHBhdGg9XCIvYXBwXCIgZWxlbWVudD17PEFwcFNoZWxsIC8+fT5cbiAgICAgICAgICA8Um91dGUgaW5kZXggZWxlbWVudD17PFRvZGF5RGFzaGJvYXJkIC8+fSAvPlxuICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiZWxkZXJcIiBlbGVtZW50PXs8RWxkZXJUb2RheSAvPn0gLz5cbiAgICAgICAgICA8Um91dGUgcGF0aD1cIm1lZGljYXRpb25zXCIgZWxlbWVudD17PE1lZGljYXRpb25zIC8+fSAvPlxuICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiY2FsZW5kYXJcIiBlbGVtZW50PXs8Q2FsZW5kYXJWaWV3IC8+fSAvPlxuICAgICAgICAgIDxSb3V0ZSBwYXRoPVwiYXBwb2ludG1lbnRzXCIgZWxlbWVudD17PEFwcG9pbnRtZW50cyAvPn0gLz5cbiAgICAgICAgICA8Um91dGUgcGF0aD1cImhlYWx0aFwiIGVsZW1lbnQ9ezxIZWFsdGhMb2cgLz59IC8+XG4gICAgICAgICAgPFJvdXRlIHBhdGg9XCJyZXBvcnRzXCIgZWxlbWVudD17PEFkaGVyZW5jZVJlcG9ydHMgLz59IC8+XG4gICAgICAgICAgPFJvdXRlIHBhdGg9XCJtZW1iZXJzXCIgZWxlbWVudD17PENvbnNlbnRDZW50ZXIgLz59IC8+XG4gICAgICAgICAgPFJvdXRlIHBhdGg9XCJlbWVyZ2VuY3lcIiBlbGVtZW50PXs8RW1lcmdlbmN5Q2FyZFBhZ2UgLz59IC8+XG4gICAgICAgICAgPFJvdXRlIHBhdGg9XCJzZXR0aW5nc1wiIGVsZW1lbnQ9ezxTZXR0aW5nc1BhZ2UgLz59IC8+XG4gICAgICAgIDwvUm91dGU+XG4gICAgICAgIDxSb3V0ZSBwYXRoPVwiKlwiIGVsZW1lbnQ9ezxOYXZpZ2F0ZSB0bz1cIi9cIiByZXBsYWNlIC8+fSAvPlxuICAgICAgPC9Sb3V0ZXM+XG4gICAgICA8VG9hc3RlciByaWNoQ29sb3JzIHBvc2l0aW9uPVwiYm90dG9tLXJpZ2h0XCIgLz5cbiAgICA8Lz5cbiAgKTtcbn1cbiJdLCJmaWxlIjoiL2FwcC9mcm9udGVuZC9zcmMvQXBwLnRzeCJ9
