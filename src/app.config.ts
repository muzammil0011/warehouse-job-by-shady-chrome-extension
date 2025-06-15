import { cities } from "./constants";

export default defineAppConfig({
  theme: {
    colorPrimary: "#ff6200",
    font: "Poppins",
  },
  appSettings: {
    botStatus: false,
    selectedCity: "Toronto",
    lat: 43.653524,
    lng: -79.383907,
    distance: "5",
    jobType: "Any",
    cityTags: cities,
    minInterval: 100,
    maxInterval: 200,
    randomInterval: 200,
    loginCountry: "Canada",
    loginEmail: null,
    loginPin: null,
    lastModalDate: null,
  },
});

// Define types for your config
declare module "wxt/utils/define-app-config" {
  interface WxtAppConfig {
    theme?: {
      colorPrimary?: string;
      font?: string;
    };
    appSettings: Settings;
  }
}
