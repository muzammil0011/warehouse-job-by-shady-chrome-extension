import { onMessage } from "webext-bridge/content-script";

const AutoFlow = () => {
  const { settings, saveSettings } = useSettings();
  useEffect(() => {
    if (settings && settings.botStatus) {
      // Click consent button if available
      document.arrive(
        'button[data-test-component="StencilReactButton"][data-test-id="consentBtn"] div[data-test-component="StencilReactRow"].hvh-careers-emotion-n1m10m',
        { existing: true },
        function (element) {
          const consentButton = element as HTMLElement;
          consentButton.click();
        },
      );

      document.arrive("video", { existing: true }, function (element) {
        const video = element as HTMLElement;
        video.remove();
      });

      onMessage("PLAY_SOUND", () => {
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
      });

      onMessage("START_AUTOFLOW", () => {
        handleJobDetailPage();
      });
    }
  }, [settings]);

  function waitAndClickArrive(
    selector: string,
    options: {
      multiple?: boolean;
      timeout?: number;
      onFound?: (el: HTMLElement) => void;
      fallback?: () => void;
    },
  ): void {
    document.arrive(
      selector,
      { existing: true, onceOnly: true },
      function (el) {
        const element = el as HTMLElement;
        if (options.onFound) {
          options.onFound(element);
        }
      },
    );

    // Fallback timeout
    if (options.timeout && options.fallback) {
      setTimeout(() => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          options.onFound?.(element);
        } else {
          options.fallback?.();
        }
      }, options.timeout);
    }
  }

  function handleJobDetailPage(): void {
    waitAndClickArrive("div[data-test-component='StencilText'] em", {
      timeout: 3000,
      onFound: (el) => {
        el.click();
        handleScheduleSelection();
      },
      fallback: () => {
        const scheduleLink = document.querySelector(
          "div[data-test-component='StencilText'] em",
        ) as HTMLElement;
        if (scheduleLink) {
          scheduleLink.click();
          handleScheduleSelection();
        }
      },
    });
  }

  function handleScheduleSelection(): void {
    waitAndClickArrive(".scheduleCardLabelText", {
      multiple: true,
      onFound: () => {
        const scheduleCards = document.querySelectorAll(
          ".scheduleCardLabelText",
        );
        if (scheduleCards.length > 0) {
          const randomIndex = Math.floor(Math.random() * scheduleCards.length);
          const selectedSchedule = scheduleCards[randomIndex] as HTMLElement;
          selectedSchedule.click();
          handleApplicationSubmission();
        }
      },
      fallback: () => {
        const interval = setInterval(() => {
          const scheduleCards = document.querySelectorAll(
            ".scheduleCardLabelText",
          );
          if (scheduleCards.length > 0) {
            const randomIndex = Math.floor(
              Math.random() * scheduleCards.length,
            );
            const selectedSchedule = scheduleCards[randomIndex] as HTMLElement;
            selectedSchedule.click();
            clearInterval(interval);
            handleApplicationSubmission();
          }
        }, 1000);
      },
    });
  }

  function handleApplicationSubmission(): void {
    waitAndClickArrive('button[data-test-id="jobDetailApplyButtonDesktop"]', {
      onFound: (el) => {
        el.click();
      },
      fallback: () => {
        const interval = setInterval(() => {
          const applyButton = document.querySelector(
            'button[data-test-id="jobDetailApplyButtonDesktop"]',
          ) as HTMLElement;
          if (applyButton) {
            applyButton.click();
            clearInterval(interval);
          }
        }, 1000);
      },
    });
  }

  return <div></div>;
};

export default AutoFlow;
