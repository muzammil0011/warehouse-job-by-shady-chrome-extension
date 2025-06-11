import {
  findAndClickDisabledElement,
  findAndClickElement,
} from "@/utils/functions";
import "arrive";
import "./fetch";
export default defineContentScript({
  matches: [
    "*://*.example.com/*",
    "https://hiring.amazon.ca/*",
    "*://auth.hiring.amazon.com/*",
  ],
  // 2. Set cssInjectionMode
  cssInjectionMode: "ui",

  async main(ctx) {
    const result = await browser.storage.local.get(["botStatus"]);
    if (result.botStatus) {
      document.arrive(
        "button",
        { existing: true },
        function (element: Element) {
          findAndClickElement("Apply", "button");

          findAndClickElement("Next", "button");

          findAndClickElement("Start Application", "button");

          findAndClickElement("Select this job", "button");

          findAndClickElement("Accept Offer", "button");

          findAndClickElement("Submit application", "button");

          findAndClickElement("Submit your shift preferences", "button");

          findAndClickElement("Save Preferences", "button");

          findAndClickElement("Confirm Selection", "button");
        },
      );

      document.arrive(
        ".scheduleCardContainer",
        { existing: true },
        function (element: Element) {
          if (element instanceof HTMLElement) {
            const clickEvent = new MouseEvent("click", { bubbles: true });
            const eventSuccess = element.dispatchEvent(clickEvent);

            // If event simulation fails, use .click()
            if (!eventSuccess) {
              element.click();
            }
          }
        },
      );
      document.arrive(
        "button",
        { existing: true },
        function (element: Element) {
          findAndClickDisabledElement("Create Application", "button");
          findAndClickDisabledElement("Select this job", "button");
          findAndClickDisabledElement("Accept Offer", "button");
          findAndClickDisabledElement("Submit application", "button");
        },
      );

      document.arrive("video", { existing: true }, function (element: Element) {
        element.remove();
      });
    }
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "playSound") {
        console.log("Attempting to play sound...");
        const alertSound = new Audio(
          browser.runtime.getURL("alert.wav" as any),
        );
        alertSound
          .play()
          .then(() => {
            console.log("Sound played successfully.");
          })
          .catch((error) => {
            const btn = document.createElement("button");
            btn.style.display = "none";
            document.body.appendChild(btn);
            btn.addEventListener("click", () => {
              alertSound.play();
            });
            btn.click();
            document.body.removeChild(btn);
          });
      }
    });
  },
});
