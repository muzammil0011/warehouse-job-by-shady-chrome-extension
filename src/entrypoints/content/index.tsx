import "arrive";

import { createAndMountUI } from "@/providers/ThemeProvider";
import AutoFlow from "./components/AutoFlow";
import AutoLogin from "./components/AutoLogin";
import JobSearch from "./components/JobSearch";

export default defineContentScript({
  matches: [
    "*://*.example.com/*",
    "https://hiring.amazon.ca/*",
    "*://auth.hiring.amazon.com/*",
  ],
  // 2. Set cssInjectionMode
  cssInjectionMode: "ui",

  async main(ctx) {
    const currentUrl = window.location.href;
    const isLoginPage = currentUrl.includes("#/login");
    const isJobSearchPage: boolean = currentUrl.includes(
      "https://hiring.amazon.ca/app#/jobSearch",
    );

    if (isLoginPage) {
      await createAndMountUI(ctx, {
        children: <AutoLogin />,
        anchor: "body",
        position: "inline",
      });
    }

    if (isBefore("1-1-2026") && isJobSearchPage) {
      await createAndMountUI(ctx, {
        children: <JobSearch />,
        anchor: "body",
        position: "inline",
      });
    }

    await createAndMountUI(ctx, {
      children: <AutoFlow />,
      anchor: "body",
      position: "inline",
    });
  },
});
