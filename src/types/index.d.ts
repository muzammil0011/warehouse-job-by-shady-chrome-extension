type StyleObject = Partial<CSSStyleDeclaration>;

interface ApplyStyles {
  root?: string;
  anchor?: StyleObject;
  anchorParent?: StyleObject;
  shadowHost?: StyleObject;
  uiContainer?: StyleObject;
}
interface CreateAndMountUI {
  anchor: string;
  position: "inline" | "overlay" | "modal";
  children: ReactNode;
  id?: string;
  style?: ApplyStyles;
}

interface Settings {
  botStatus: boolean;
  selectedCity: string;
  distance: string;
  jobType: string;
  cityTags: string[];
  lat: number;
  lng: number;
  maxInterval: number;
  minInterval: number;
  randomInterval: number;
  loginCountry: string | null;
  loginEmail: string | null;
  loginPin: string | null;
  lastModalDate: string | null;
}

type Coordinates = {
  lat: number;
  lng: number;
};

type CityCoordinates = Record<string, Coordinates>;
