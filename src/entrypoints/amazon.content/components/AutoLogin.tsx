import { useAntd } from "@/providers/ThemeProvider";
import { Form, Input, Modal, Select } from "antd";
import "arrive";
import React, { useEffect, useState } from "react";

const { Option } = Select;

const AutoLogin: React.FC = () => {
  const { message } = useAntd();
  const { settings, saveSettings } = useSettings();
  const [form] = Form.useForm<Settings>();
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  useEffect(() => {
    if (!settings) return;

    (async function () {
      if (settings.botStatus) {
        const { loginCountry, loginEmail, loginPin } = settings;
        if (!loginCountry || !loginEmail || !loginPin) setModalVisible(true);

        // Handle country dropdown
        const countryToggle = document.querySelector(
          "#country-toggle-button",
        ) as HTMLElement;
        if (countryToggle) {
          countryToggle.click();
          await new Promise((resolve: (value: unknown) => void) =>
            setTimeout(resolve, 500),
          );

          const selectedCountry: string = await new Promise(
            (resolve: (value: string) => void) => {
              resolve(loginCountry);
            },
          );

          const countryList = document.querySelector('ul[role="listbox"]');
          if (countryList) {
            const countryOptions = countryList.querySelectorAll("li");
            countryOptions.forEach((option: Element) => {
              if (option.textContent?.trim() === selectedCountry) {
                (option as HTMLElement).click();
              }
            });
          }
        }

        // Fill in login form
        document.arrive(
          'input[data-test-id="input-test-id-login"]',
          { existing: true },
          function (element) {
            // Fill in PIN
            const loginInput = element as HTMLInputElement;
            if (loginInput && loginEmail) {
              loginInput.value = loginEmail;
              loginInput.dispatchEvent(new Event("input", { bubbles: true }));

              const continueButtons = document.querySelectorAll(
                'div[data-test-component="StencilReactRow"]',
              );
              continueButtons.forEach((button: Element) => {
                if (button.textContent?.trim() === "Continue") {
                  (button as HTMLElement).click();
                }
              });
            }
          },
        );

        document.arrive(
          'input[data-test-id="input-test-id-pin"]',
          { existing: true },
          function (element) {
            // Fill in PIN
            const pinInput = element as HTMLInputElement;
            if (pinInput && loginPin) {
              pinInput.value = loginPin;
              pinInput.dispatchEvent(new Event("input", { bubbles: true }));

              const continueButton = document.querySelector(
                'button[data-test-id="button-continue"]',
              ) as HTMLElement;
              if (continueButton) {
                continueButton.click();
              }
            }
          },
        );
      }
    })();
  }, [settings]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await saveSettings(values);
      message.success("Login Details Saved.");
      setModalVisible(false);
      window.location.reload();
    } catch (error) {
      console.warn("Validation failed", error);
    }
  };

  return (
    <>
      <Modal
        title="Login Details"
        open={modalVisible}
        closable
        maskClosable={false}
        onOk={handleSubmit}
        okText="Save"
      >
        <Form
          form={form}
          className="w-full py-2"
          initialValues={settings || {}}
        >
          <Form.Item
            label={<span className="w-[60px] text-left">Country</span>}
            name="loginCountry"
            rules={[{ required: true, message: "Please select your country" }]}
          >
            <Select
              style={{ width: "100%" }}
              placeholder="Select a country"
              onChange={(selected) =>
                form.setFieldValue("loginCountry", selected)
              }
            >
              <Option value="Canada">Canada</Option>
              <Option value="United States">United States</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={<span className="w-[60px] text-left">Email</span>}
            name="loginEmail"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input
              type="email"
              placeholder="Enter your email"
              onChange={(e) => form.setFieldValue("loginEmail", e.target.value)}
            />
          </Form.Item>

          <Form.Item
            label={<span className="w-[60px] text-left">Pin</span>}
            name="loginPin"
            rules={[{ required: true, message: "Please enter your PIN" }]}
          >
            <Input
              type="text"
              placeholder="Enter PIN"
              onChange={(e) => form.setFieldValue("loginPin", e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AutoLogin;
