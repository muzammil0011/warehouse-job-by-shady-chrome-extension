import "./autoShiftPicker.ts";
function handleJobDetailPage(): void {
  let scheduleClicked = false;

  const jobDetailObserver = new MutationObserver((_, observer): void => {
    const scheduleLink = document.querySelector(
      'div[data-test-component="StencilText"] em',
    ) as HTMLElement;
    if (scheduleLink && !scheduleClicked) {
      scheduleClicked = true;
      scheduleLink.click();
      observer.disconnect();
      handleScheduleSelection();
    }
  });

  jobDetailObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  setTimeout((): void => {
    const scheduleLink = document.querySelector(
      'div[data-test-component="StencilText"] em',
    ) as HTMLElement;
    if (scheduleLink && !scheduleClicked) {
      scheduleClicked = true;
      scheduleLink.click();
      handleScheduleSelection();
    }
  }, 3000);
}

function handleScheduleSelection(): void {
  const clickedSchedules = new WeakSet<Element>();

  const scheduleObserver = new MutationObserver((_, observer): void => {
    const scheduleCards = document.querySelectorAll(".scheduleCardLabelText");
    const unclicked = Array.from(scheduleCards).filter(
      (el) => !clickedSchedules.has(el),
    );
    if (unclicked.length > 0) {
      const selected = unclicked[
        Math.floor(Math.random() * unclicked.length)
      ] as HTMLElement;
      clickedSchedules.add(selected);
      selected.click();
      observer.disconnect();
      clearInterval(scheduleInterval);
      handleApplicationSubmission();
    }
  });

  scheduleObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  const scheduleInterval = setInterval((): void => {
    const scheduleCards = document.querySelectorAll(".scheduleCardLabelText");
    const unclicked = Array.from(scheduleCards).filter(
      (el) => !clickedSchedules.has(el),
    );
    if (unclicked.length > 0) {
      const selected = unclicked[
        Math.floor(Math.random() * unclicked.length)
      ] as HTMLElement;
      clickedSchedules.add(selected);
      selected.click();
      scheduleObserver.disconnect();
      clearInterval(scheduleInterval);
      handleApplicationSubmission();
    }
  }, 1000);
}

function handleApplicationSubmission(): void {
  let applyClicked = false;

  const applyObserver = new MutationObserver((_, observer): void => {
    const applyButton = document.querySelector(
      'button[data-test-id="jobDetailApplyButtonDesktop"]',
    ) as HTMLElement;
    if (applyButton && !applyClicked) {
      applyClicked = true;
      applyButton.click();
      observer.disconnect();
      clearInterval(applyInterval);
    }
  });

  applyObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  const applyInterval = setInterval((): void => {
    const applyButton = document.querySelector(
      'button[data-test-id="jobDetailApplyButtonDesktop"]',
    ) as HTMLElement;
    if (applyButton && !applyClicked) {
      applyClicked = true;
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
    let buttonClicked = false;

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
              buttonClicked = true;
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

      if (buttonClicked) {
        log("Button already clicked. Stopping attempts.");
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
