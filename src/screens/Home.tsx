import Tags from "@/components/Tags";
import { useAntd } from "@/providers/ThemeProvider";
import { AutoComplete, Button, Form, Input, Select, Switch } from "antd";
import { debounce } from "lodash";

function Home() {
  const { message } = useAntd();
  const { settings, saveSettings } = useSettings();
  const [form] = Form.useForm<Settings>();
  const [loading, setLoading] = useState(true);
  const debouncedSubmit = useRef(debounce(onSubmit, 500)).current;

  const citiesInfo: CityCoordinates = {
    Acheson: { lat: 53.548701, lng: -113.76261 },
    Ajax: { lat: 43.850814, lng: -79.020296 },
    Balzac: { lat: 51.212985, lng: -114.007862 },
    Bolton: { lat: 43.875473, lng: -79.734437 },
    Brampton: { lat: 43.685271, lng: -79.759924 },
    Calgary: { lat: 51.045113, lng: -114.057141 },
    Cambridge: { lat: 43.361621, lng: -80.314429 },
    Concord: { lat: 43.80011, lng: -79.48291 },
    Dartmouth: { lat: 44.67134, lng: -63.57719 },
    Edmonton: { lat: 53.54545, lng: -113.49014 },
    Etobicoke: { lat: 43.65421, lng: -79.56711 },
    Hamilton: { lat: 43.25549, lng: -79.873376 },
    Mississauga: { lat: 43.58882, lng: -79.644378 },
    Nisku: { lat: 53.337845, lng: -113.531304 },
    Ottawa: { lat: 45.425226, lng: -75.699963 },
    "Rocky View": { lat: 51.18341, lng: -113.93527 },
    Scarborough: { lat: 43.773077, lng: -79.257774 },
    Sidney: { lat: 48.650629, lng: -123.398604 },
    "ST. Thomas": { lat: 42.777414, lng: -81.182973 },
    "Stoney Creek": { lat: 43.21681, lng: -79.76633 },
    Toronto: { lat: 43.653524, lng: -79.383907 },
    Vancouver: { lat: 49.261636, lng: -123.11335 },
    Vaughan: { lat: 43.849270138, lng: -79.535136594 },
    Whitby: { lat: 43.897858, lng: -78.943434 },
    Windsor: { lat: 42.317438, lng: -83.035225 },
    Burnaby: { lat: 49.2664, lng: -122.953 },
    Winnipeg: { lat: 49.895136, lng: -97.138374 },
    Moncton: { lat: 46.087817, lng: -64.778231 },
    Halifax: { lat: 44.648693, lng: -63.575239 },
    Belleville: { lat: 44.162758, lng: -77.383184 },
    London: { lat: 42.984923, lng: -81.245277 },
    Milton: { lat: 43.518054, lng: -79.877291 },
    Woodbridge: { lat: 43.783333, lng: -79.566666 },
    "Coteau-du-Lac": { lat: 45.350001, lng: -74.216667 },
    Dorval: { lat: 45.449722, lng: -73.755 },
    Lachine: { lat: 45.447778, lng: -73.631111 },
    Laval: { lat: 45.606667, lng: -73.7125 },
    Longueuil: { lat: 45.531111, lng: -73.518333 },
    Montreal: { lat: 45.508888, lng: -73.561668 },
    "Saint-Hubert": { lat: 45.519444, lng: -73.459444 },
    Regina: { lat: 50.445211, lng: -104.618894 },
  };

  const initialValues = {
    botStatus: true,
    selectedCity: "Toronto",
    lat: 43.653524,
    lng: -79.383907,
    distance: "5",
    jobType: "Any",
    cityTags: [
      "Bolton",
      "Brampton",
      "Burnaby",
      "Cambridge",
      "Concord",
      "Toronto",
      "Sidney",
    ],
    minInterval: 100,
    maxInterval: 200,
    randomInterval: 200,
    loginCountry: null,
    loginEmail: null,
    loginPin: null,
    lastModalDate: null,
  };

  const cities = Object.keys(citiesInfo).sort();
  const distance = ["5", "15", "25", "35", "50", "75", "150"];
  const hours = ["Any", "Full-Time", "Part-Time", "Flex-Time"];

  const cityOptions = cities.map((city) => ({ label: city, value: city }));
  const distanceOptions = distance.map((distance) => ({
    label: distance,
    value: distance,
  }));
  const hoursOptions = hours.map((hour) => ({ label: hour, value: hour }));

  function getCordinates(cityName: string) {
    const coordinates = citiesInfo[cityName as keyof typeof citiesInfo];
    if (!coordinates) return null;

    return {
      ...coordinates,
    };
  }

  useEffect(() => {
    if (!settings) return;
    form.setFieldsValue(settings);
    setLoading(false);
  }, [settings]);

  async function onSubmit(settings: Settings) {
    try {
      let randomInterval = 200;
      const min = settings.minInterval;
      const max = settings.maxInterval;

      if (!isNaN(min) && !isNaN(max) && min <= max) {
        randomInterval = Math.floor(Math.random() * (max - min + 1)) + min;
      }

      const cordinates = getCordinates(form.getFieldValue("selectedCity"));
      await saveSettings({ ...cordinates, ...settings, randomInterval });
      if (settings.botStatus) {
        let [tab] = await chrome.tabs.query({
          active: true,
          lastFocusedWindow: true,
        });
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: "activate",
            status: settings.botStatus,
          });
        }
      }
      message.success("Settings saved");
    } catch (error) {
      message.error("Saving failed, please try again");
    }
  }

  return (
    <>
      <div className="flex flex-col justify-center items-center gap-4">
        {loading ? (
          <Loader />
        ) : (
          <Form
            form={form}
            className="w-full py-2"
            initialValues={initialValues}
            onValuesChange={(_, allValues) => {
              debouncedSubmit(allValues);
            }}
          >
            <Form.Item
              label={<span>Activate the Script</span>}
              name="botStatus"
              className="item-flex mt-0"
            >
              <Switch
                onChange={(checked) => form.setFieldValue("botStatus", checked)}
              />
            </Form.Item>
            <div className="flex gap-2">
              <Form.Item
                label={<span>Min Interval (ms)</span>}
                name="minInterval"
                className="item-flex mt-0 pt-0"
              >
                <Input
                  className="w-full"
                  placeholder="Min ms"
                  type="number"
                  onChange={(e) => {
                    form.setFieldValue("minInterval", Number(e.target.value));
                  }}
                />
              </Form.Item>

              <Form.Item
                label={<span>Max Interval (ms)</span>}
                name="maxInterval"
                className="item-flex mt-0 pt-0"
              >
                <Input
                  className="w-full"
                  placeholder="Max ms"
                  type="number"
                  onChange={(e) => {
                    form.setFieldValue("maxInterval", Number(e.target.value));
                  }}
                />
              </Form.Item>
            </div>
            <Form.Item
              label={<span>City</span>}
              name="selectedCity"
              className="item-flex mt-0"
            >
              <Select
                className="w-[180px]"
                options={cityOptions}
                placeholder="Select a city"
                onChange={(value) => {
                  form.setFieldValue("selectedCity", value);
                }}
              />
            </Form.Item>

            <Form.Item
              label={<span>Distance (km)</span>}
              name="distance"
              className="item-flex mt-0"
            >
              <AutoComplete
                className="w-[180px]"
                options={distanceOptions}
                placeholder="Select or enter distance"
                onChange={(value) => form.setFieldValue("distance", value)}
                filterOption={(inputValue, option) =>
                  (option?.value ?? "")
                    .toLowerCase()
                    .includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item
              label={<span>Work Hours</span>}
              name="jobType"
              className="item-flex mt-0"
            >
              <Select
                className="w-[180px]"
                options={hoursOptions}
                placeholder="Select Work Hours"
                onChange={(value) => form.setFieldValue("jobType", value)}
              />
            </Form.Item>

            <Form.Item
              label={<span>Jobs Cities</span>}
              name="cityTags"
              className="item-flex mt-0 tags-select"
            >
              <Tags
                onChange={(cityTags) =>
                  console.log("Updated cityTags:", cityTags)
                }
                allowedCities={cities}
              />
            </Form.Item>

            <div className="flex gap-2">
              <Button
                type="primary"
                onClick={() => {
                  form.resetFields();
                  onSubmit(initialValues);
                }}
                block
              >
                Reset Settings
              </Button>
            </div>
          </Form>
        )}
      </div>
    </>
  );
}

export default Home;
