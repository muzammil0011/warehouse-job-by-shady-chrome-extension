(function () {
  "use strict";

  let shiftOptions: NodeListOf<HTMLElement> | null = null;

  function log(...messages: unknown[]): void {
    console.log("[Amazon Job Detail Auto-Clicker]", ...messages);
  }

  function isCorrectPage(): boolean {
    return window.location.href.includes("/app#/jobDetail");
  }

  function isApplicationPage(): boolean {
    return window.location.href.startsWith(
      "https://hiring.amazon.ca/application/ca/",
    );
  }

  function clickShiftDropdown(): boolean {
    log("Attempting to click shift dropdown");

    const dropdownButton = document.querySelector<HTMLDivElement>(
      'div[data-test-component="StencilReactRow"].jobDetailScheduleDropdown',
    );

    if (dropdownButton) {
      dropdownButton.click();
      log("Shift dropdown clicked");
      return true;
    }

    log("Shift dropdown not found");
    return false;
  }

  function getShiftOptions(): NodeListOf<HTMLElement> {
    return document.querySelectorAll<HTMLElement>(
      'div[data-test-component="StencilReactCard"][role="button"].focusableItem',
    );
  }

  function selectRandomShift(): boolean {
    log("Attempting to select a random shift");

    if (shiftOptions && shiftOptions.length > 0) {
      const randomIndex = Math.floor(Math.random() * shiftOptions.length);
      shiftOptions[randomIndex].click();
      log(`Random shift at index ${randomIndex} selected`);
      return true;
    }

    log("No shifts found");
    return false;
  }

  function findAndClickButton(): "try_again" | "success" | false {
    if (!isCorrectPage()) {
      log("Not on job detail page. Waiting...");
      return false;
    }

    log("Searching for 'Apply' button");

    try {
      const button = document.querySelector<HTMLButtonElement>(
        'button[data-test-id="jobDetailApplyButtonDesktop"]',
      );

      if (button) {
        if (button.disabled) {
          log("Apply button found but disabled. Trying another random shift.");
          return "try_again";
        } else {
          log("Found enabled Apply button:", button.textContent?.trim());
          button.click();
          log("Apply button clicked!");
          return "success";
        }
      }

      log("Apply button not found. Retrying...");
      return false;
    } catch (error) {
      const err = error as Error;
      log("Error in findAndClickButton:", err.message);
      return false;
    }
  }

  function attemptClick(): void {
    if (isApplicationPage()) {
      log("On application page. Stopping the script.");
      return;
    }

    if (!shiftOptions) {
      if (clickShiftDropdown()) {
        setTimeout(() => {
          shiftOptions = getShiftOptions();
          attemptClick();
        }, 200);
      } else {
        setTimeout(attemptClick, 200);
      }
      return;
    }

    selectRandomShift();

    setTimeout(() => {
      const result = findAndClickButton();

      if (result === "try_again") {
        setTimeout(attemptClick, 200);
      } else if (result === "success") {
        log("Application successful. Stopping the script.");
      } else {
        setTimeout(attemptClick, 200);
      }
    }, 1000);
  }

  function startProcess(): void {
    if (isApplicationPage()) {
      log("On application page. Script will not run.");
      return;
    }

    log("Script started. Attempting to find and click the button...");
    attemptClick();
  }
  startProcess();
  if (document.readyState === "complete") {
    startProcess();
  } else {
    window.addEventListener("load", startProcess);
  }

  window.addEventListener("hashchange", startProcess);

  log("Script initialized and waiting for page load.");
})();
