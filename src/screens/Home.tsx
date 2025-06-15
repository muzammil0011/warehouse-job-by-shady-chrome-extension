import Tags from "@/components/Tags";
import { cities, citiesInfo, distance, hours } from "@/constants";
import { useAntd } from "@/providers/ThemeProvider";
import { AutoComplete, Button, Form, Input, Select, Switch } from "antd";
import { debounce } from "lodash";

function Home() {
  const { message } = useAntd();
  const { settings, saveSettings } = useSettings();
  const [form] = Form.useForm<Settings>();
  const [loading, setLoading] = useState(true);
  const debouncedSubmit = useRef(debounce(onSubmit, 500)).current;

  const cityOptions = cities.map((city) => ({ label: city, value: city }));
  const distanceOptions = distance.map((distance) => ({
    label: distance,
    value: distance,
  }));
  const hoursOptions = hours.map((hour) => ({ label: hour, value: hour }));

  const initialValues = {
    botStatus: true,
    selectedCity: "Toronto",
    lat: 43.653524,
    lng: -79.383907,
    distance: "5",
    jobType: "Any",
    cityTags: cities,
    minInterval: 100,
    maxInterval: 200,
    randomInterval: 200,
    loginCountry: null,
    loginEmail: null,
    loginPin: null,
    lastModalDate: null,
  };

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
      const min = Number(settings.minInterval);
      const max = Number(settings.maxInterval);

      let randomInterval = 200;

      if (!isNaN(min) && !isNaN(max) && min <= max) {
        randomInterval = Math.floor(Math.random() * (max - min + 1)) + min;
      }

      const cordinates = getCordinates(form.getFieldValue("selectedCity"));
      await saveSettings({ ...cordinates, ...settings, randomInterval });
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
              className="item-flex mt-0 hidden"
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
              className="item-flex mt-0 hidden"
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
