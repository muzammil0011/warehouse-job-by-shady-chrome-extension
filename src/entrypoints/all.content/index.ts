import "./autoShiftPicker.ts";
// Handle job detail page interactions
function handleJobDetailPage(): void {
  const jobDetailObserver = new MutationObserver(
    (mutations: MutationRecord[], observer: MutationObserver): void => {
      const scheduleLink = document.querySelector(
        'div[data-test-component="StencilText"] em',
      ) as HTMLElement;
      if (scheduleLink) {
        scheduleLink.click();
        observer.disconnect();
        handleScheduleSelection();
      }
    },
  );

  jobDetailObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Fallback click after timeout
  setTimeout((): void => {
    const scheduleLink = document.querySelector(
      'div[data-test-component="StencilText"] em',
    ) as HTMLElement;
    if (scheduleLink) {
      scheduleLink.click();
      handleScheduleSelection();
    }
  }, 3000);
}

// Handle schedule selection
function handleScheduleSelection(): void {
  const scheduleObserver = new MutationObserver(
    (mutations: MutationRecord[], observer: MutationObserver): void => {
      const scheduleCards = document.querySelectorAll(".scheduleCardLabelText");
      if (scheduleCards.length > 0) {
        // Select random schedule
        const randomIndex: number = Math.floor(
          Math.random() * scheduleCards.length,
        );
        const selectedSchedule = scheduleCards[randomIndex] as HTMLElement;
        selectedSchedule.click();
        observer.disconnect();
        if (scheduleInterval) {
          clearInterval(scheduleInterval);
        }
        handleApplicationSubmission();
      }
    },
  );

  scheduleObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Fallback selection with interval
  const scheduleInterval: NodeJS.Timeout = setInterval((): void => {
    const scheduleCards = document.querySelectorAll(".scheduleCardLabelText");
    if (scheduleCards.length > 0) {
      const randomIndex: number = Math.floor(
        Math.random() * scheduleCards.length,
      );
      const selectedSchedule = scheduleCards[randomIndex] as HTMLElement;
      selectedSchedule.click();
      scheduleObserver.disconnect();
      clearInterval(scheduleInterval);
      handleApplicationSubmission();
    }
  }, 1000);
}

// Handle final application submission
function handleApplicationSubmission(): void {
  const applyObserver = new MutationObserver(
    (mutations: MutationRecord[], observer: MutationObserver): void => {
      const applyButton = document.querySelector(
        'button[data-test-id="jobDetailApplyButtonDesktop"]',
      ) as HTMLElement;
      if (applyButton) {
        applyButton.click();
        observer.disconnect();
        if (applyInterval) {
          clearInterval(applyInterval);
        }
      }
    },
  );

  applyObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Fallback application with interval
  const applyInterval: NodeJS.Timeout = setInterval((): void => {
    const applyButton = document.querySelector(
      'button[data-test-id="jobDetailApplyButtonDesktop"]',
    ) as HTMLElement;
    if (applyButton) {
      applyButton.click();
      applyObserver.disconnect();
      clearInterval(applyInterval);
    }
  }, 1000);
}

export default defineContentScript({
  matches: ["<all_urls>"],

  main(_ctx) {
    "use strict";

    let isRunning = true;

    const log = (...messages: unknown[]) => {
      console.log("[Amazon Application Creation Auto-Clicker]", ...messages);
    };

    const isCorrectPage = (): boolean => {
      return (
        window.location.href.includes("/application/ca/") &&
        window.location.href.includes("consent")
      );
    };

    const findAndClickButton = (): boolean => {
      if (!isCorrectPage()) {
        log("Not on application creation page. Waiting...");
        return false;
      }

      log("Searching for 'Create Application' button");

      try {
        const buttonTexts = [
          "Create Application",
          "Apply",
          "Submit Application",
        ];
        const buttons = document.getElementsByTagName(
          "button",
        ) as HTMLCollectionOf<HTMLButtonElement>;

        for (const button of Array.from(buttons)) {
          const buttonText = button.textContent?.trim() ?? "";
          if (buttonTexts.includes(buttonText)) {
            log("Found button:", buttonText);

            if (!button.disabled && button.offsetParent !== null) {
              button.click();
              log("Button clicked! Stopping script.");
              isRunning = false;
              return true;
            } else {
              log("Button found but not clickable. Will retry...");
              return false;
            }
          }
        }

        log("Button not found. Retrying...");
        return false;
      } catch (error) {
        const err = error as Error;
        log("Error in findAndClickButton:", err.message);
        return false;
      }
    };

    const attemptClick = (): void => {
      if (!isRunning) {
        log("Script stopped.");
        return;
      }

      if (!findAndClickButton()) {
        setTimeout(attemptClick, 100); // Retry every 100ms
      }
    };

    const startProcess = (): void => {
      if (isRunning) {
        log("Script started. Attempting to find and click the button...");
        attemptClick();
      }
    };
    startProcess();
    // Start the process when the page is fully loaded
    if (document.readyState === "complete") {
      startProcess();
    } else {
      window.addEventListener("load", startProcess);
    }

    // Run the script when the URL changes (for single-page applications)
    window.addEventListener("popstate", startProcess);

    log("Script initialized and waiting for page load.");

    handleJobDetailPage();
  },
});
