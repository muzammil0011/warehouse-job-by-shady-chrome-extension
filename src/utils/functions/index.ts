// Function to find and click element by text
export const findAndClickElement = (
  text: string,
  selector: string = "*",
): void => {
  const elements = Array.from(document.querySelectorAll(selector));
  const element = elements.find((el) => el.textContent?.includes(text));

  if (element instanceof HTMLElement && !element.dataset.clicked) {
    console.log(`${text} ${element.tagName} Found 🎊`);

    // Try dispatching the event first
    const clickEvent = new MouseEvent("click", { bubbles: true });
    const eventSuccess = element.dispatchEvent(clickEvent);

    // If event simulation fails, use .click()
    if (!eventSuccess) {
      element.click();
    }

    // Mark element as clicked to prevent multiple clicks
    element.dataset.clicked = "true";
  }
};

export const findAndClickDisabledElement = (
  text: string,
  selector: string = "*",
): void => {
  const elements = Array.from(document.querySelectorAll(selector));
  const element = elements.find((el) => el.textContent?.includes(text));

  if (element instanceof HTMLElement) {
    console.log(`${text} ${element.tagName} Found 🎊`);

    const tryClick = () => {
      if (!(element as HTMLButtonElement).disabled) {
        const clickEvent = new MouseEvent("click", { bubbles: true });
        const eventSuccess = element.dispatchEvent(clickEvent);
        if (!eventSuccess) element.click();
      } else {
        console.log(`${text} button is disabled, waiting...`);
        const observer = new MutationObserver(() => {
          if (!(element as HTMLButtonElement).disabled) {
            observer.disconnect();
            console.log(`${text} button is now enabled! Clicking...`);
            findAndClickDisabledElement(text, selector);
          }
        });
        observer.observe(element, {
          attributes: true,
          attributeFilter: ["disabled"],
        });
      }
    };

    tryClick();
  }
};
