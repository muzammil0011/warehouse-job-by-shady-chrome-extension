import Swal from "sweetalert2";
interface JobCard {
  jobId: string;
  jobTitle: string;
  city: string;
  distance: number;
}

interface SearchJobRequest {
  locale: string;
  country: string;
  keyWords: string;
  equalFilters: any[];
  containFilters: FilterItem[];
  rangeFilters: RangeFilter[];
  orFilters: any[];
  dateFilters: DateFilter[];
  sorters: any[];
  pageSize: number;
  geoQueryClause: GeoQuery;
  consolidateSchedule: boolean;
}

interface FilterItem {
  key: string;
  val: string[];
}

interface RangeFilter {
  key: string;
  range: {
    minimum: number;
    maximum: number;
  };
}

interface DateFilter {
  key: string;
  range: {
    startDate: string;
  };
}

interface GeoQuery {
  lat: number;
  lng: number;
  unit: string;
  distance: number;
}

interface GraphQLQuery {
  operationName: string;
  variables: {
    searchJobRequest: SearchJobRequest;
  };
  query: string;
}

interface JobSearchResponse {
  data: {
    searchJobCardsByLocation: {
      nextToken: string;
      jobCards: JobCard[];
    };
  };
}

interface StorageData {
  __un?: string;
  __pw?: string;
  candidateID?: string;
  selectedCity?: string;
  lat?: number;
  lng?: number;
  distance?: number;
  jobType?: string;
  botStatus?: boolean;
  __country?: string;
  __uc?: boolean;
  cityTags?: string[];
}

interface RuntimeMessage {
  action: string;
  status?: boolean;
  data?: any;
}

(async function (currentPathname: string): Promise<void> {
  // Inject CSS styles for SweetAlert2 modals
  document.head.insertAdjacentHTML(
    "beforeend",
    `<style>
    .swal2-container{z-index: 999999; font-family: sans-serif}
      .swal2-modal :is(h2, p) { 
        color: initial; 
        margin: 0; 
        line-height: 1.25; 
      }
      .swal2-modal p+p { 
        margin-top: 1rem; 
      }
      #consulate_date_time, #asc_date_time { 
        display: block!important; 
      }
      .swal2-select { 
        width: auto!important; 
      }
      .swal2-timer-progress-bar { 
        background: rgba(255,255,255,0.6)!important; 
      }
      .swal2-toast.swal2-show { 
        background: rgba(0,0,0,0.75)!important; 
      }
    </style>`,
  );
  // await waitForSwalReady();
  // Global variables
  let jobSearchInterval: NodeJS.Timeout | null = null;
  let toastDuration: number = 200;
  const excludedUrlPatterns: string[] = [
    "already-applied-but-can-be-reset",
    "consent",
  ];

  // Check if current URL should be excluded
  function shouldExcludeCurrentUrl(): boolean {
    const currentUrl: string = window.location.href;
    return excludedUrlPatterns.some((pattern: string) =>
      currentUrl.includes(pattern),
    );
  }

  // Early exit if URL should be excluded
  if (shouldExcludeCurrentUrl()) return;

  // Wait for email input field to appear
  async function waitForEmailField(): Promise<HTMLInputElement | null> {
    const maxWaitTime: number = 10000; // 10 seconds
    const checkInterval: number = 250; // 250ms
    let elapsedTime: number = 0;

    while (elapsedTime < maxWaitTime) {
      const emailInput = document.querySelector(
        'input[data-test-id="input-test-id-emailId"]',
      ) as HTMLInputElement;
      if (emailInput && emailInput.value) return emailInput;

      await new Promise((resolve: (value: unknown) => void) =>
        setTimeout(resolve, checkInterval),
      );
      elapsedTime += checkInterval;
    }

    // Show error and redirect if email field not found
    await Swal.fire({
      title: "Attention please.",
      html: "Please sign-in again",
      allowEscapeKey: false,
      allowOutsideClick: false,
      icon: "warning",
      confirmButtonText: "Ok",
    });

    location.href = location.href.replace("https://hiring.amazon.ca/#/", "");
    return null;
  }

  // Configuration variables
  let username: string | null = null;
  let password: string | null = null;
  let country: string | null = null;
  let candidateId: string | null = null;
  let selectedCity: string | null = null;
  let latitude: number = 43.653524; // Default Toronto coordinates
  let longitude: number = -79.383907;
  let searchDistance: number = 5;
  let jobType: string | null = null;
  let isAutoApplyEnabled: boolean = false;
  let hasShownPopupWarning: boolean = false;

  // Load configuration from Chrome storage
  async function loadConfiguration() {
    const storagePromises = [
      chrome.storage.local.get("__un").then((r) => r.__un || null),
      chrome.storage.local.get("__pw").then((r) => r.__pw || null),
      chrome.storage.local
        .get("candidateID")
        .then((r) => r.candidateID || null),
      chrome.storage.local
        .get("selectedCity")
        .then((r) => r.selectedCity || "Toronto"),
      chrome.storage.local.get("lat").then((r) => r.lat || 43.653524),
      chrome.storage.local.get("lng").then((r) => r.lng || -79.383907),
      chrome.storage.local.get("distance").then((r) => r.distance || 5),
      chrome.storage.local.get("jobType").then((r) => r.jobType || "Any"),
      chrome.storage.local
        .get("botStatus")
        .then((r) =>
          typeof r.botStatus !== "undefined" ? r.botStatus : false,
        ),
      chrome.storage.local.get("__country").then((r) => r.__country || null),
      chrome.storage.local
        .get("randomInterval")
        .then((r) => r.randomInterval || 200),
    ];

    const [
      username,
      password,
      candidateId,
      selectedCity,
      latitude,
      longitude,
      searchDistance,
      jobType,
      isAutoApplyEnabled,
      country,
      randomInterval,
    ] = await Promise.all(storagePromises);
    return {
      username,
      password,
      candidateId,
      selectedCity,
      latitude,
      longitude,
      searchDistance,
      jobType,
      isAutoApplyEnabled,
      country,
      randomInterval,
    };
  }

  // Listen for storage changes
  chrome.storage.onChanged.addListener(function (
    changes: any,
    namespace: string,
  ): void {
    if (namespace === "local") {
      if (changes.selectedCity) selectedCity = changes.selectedCity.newValue;
      if (changes.distance) searchDistance = changes.distance.newValue;
      if (changes.lat) latitude = changes.lat.newValue;
      if (changes.lng) longitude = changes.lng.newValue;
      if (changes.jobType) jobType = changes.jobType.newValue;
      if (changes.randomInterval) toastDuration = changes.randomInterval;
    }
  });

  await loadConfiguration();

  // Main application logic handler
  async function handleApplicationFlow(): Promise<void> {
    const currentUrl: string = window.location.href;
    const isContactInfoPage: boolean = currentUrl.includes(
      "#/contactInformation",
    );
    const isLoginPage: boolean = currentUrl.includes("#/login");
    const isJobSearchPage: boolean = currentUrl.includes("jobSearch");

    const hasShownPopup: boolean = await chrome.storage.local
      .get("__uc")
      .then(({ __uc }: any) => __uc);

    // Handle login page
    if (isLoginPage) {
      // Click consent button if available
      const consentButton = document.querySelector(
        'button[data-test-component="StencilReactButton"][data-test-id="consentBtn"] div[data-test-component="StencilReactRow"].hvh-careers-emotion-n1m10m',
      ) as HTMLElement;
      if (consentButton) {
        consentButton.click();
      }

      // Handle country selection
      if (!country) {
        const countryButton = document.querySelector(
          'div[data-test-component="StencilReactRow"].css-hxw9t3 button[data-test-component="StencilReactButton"][type="button"].e4s17lp0.css-1ipr55l div[data-test-component="StencilReactRow"].css-n1m10m',
        ) as HTMLElement;
        if (countryButton) {
          countryButton.click();
        }

        const countryResult = await Swal.fire({
          title: "Attention please.",
          html: "Please select your country",
          input: "select",
          inputOptions: {
            Canada: "Canada",
            "United States": "United States",
          },
          inputPlaceholder: "Select a country",
          allowEscapeKey: false,
          allowOutsideClick: false,
          icon: "warning",
          confirmButtonText: "Next",
          inputValidator: (value: any) => {
            return new Promise((resolve: (value?: string) => void) => {
              value ? resolve() : resolve("You need to select a country");
            });
          },
        });

        country = countryResult.value;
        chrome.storage.local.set({ __country: country });
      }

      // Get username if not available
      if (!username) {
        const usernameResult = await Swal.fire({
          title: "Attention please.",
          html: "Please provide the email to login",
          input: "email",
          inputLabel: "Your email address",
          inputPlaceholder: "Enter your email address",
          allowEscapeKey: false,
          allowOutsideClick: false,
          icon: "warning",
          confirmButtonText: "Next",
        });

        username = usernameResult.value;
        chrome.storage.local.set({ __un: username });
      }

      // Get password if not available
      if (!password) {
        const passwordResult = await Swal.fire({
          title: "Attention please.",
          html: "Please provide the 6-digit PIN",
          input: "password",
          inputLabel: "Your 6-digit PIN",
          inputPlaceholder: "Enter your 6-digit PIN",
          inputAttributes: {
            maxlength: "6",
            pattern: "\\d*",
          },
          allowEscapeKey: false,
          allowOutsideClick: false,
          icon: "warning",
          confirmButtonText: "Submit",
        });

        password = passwordResult.value;
        chrome.storage.local.set({ __pw: password });
      }

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
            chrome.storage.local.get("__country", (result: any) => {
              resolve(result.__country || "Canada");
            });
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
      const loginInput = document.querySelector(
        'input[data-test-id="input-test-id-login"]',
      ) as HTMLInputElement;
      if (loginInput && username) {
        loginInput.value = username;
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

      await new Promise((resolve: (value: unknown) => void) =>
        setTimeout(resolve, 1000),
      );

      // Fill in PIN
      const pinInput = document.querySelector(
        'input[data-test-id="input-test-id-pin"]',
      ) as HTMLInputElement;
      if (pinInput && password) {
        pinInput.value = password;
        pinInput.dispatchEvent(new Event("input", { bubbles: true }));

        const continueButton = document.querySelector(
          'button[data-test-id="button-continue"]',
        ) as HTMLElement;
        if (continueButton) {
          continueButton.click();
        }
      }
    }

    // Handle job search page popup warning
    if (isJobSearchPage && !hasShownPopup) {
      const consentButton = document.querySelector(
        'button[data-test-component="StencilReactButton"][data-test-id="consentBtn"] div[data-test-component="StencilReactRow"].hvh-careers-emotion-n1m10m',
      ) as HTMLElement;

      if (consentButton) {
        consentButton.click();
        const popupImageUrl: string = chrome.runtime.getURL("icons/128.png");

        await Swal.fire({
          title: "Turn on your pop-ups",
          html: `<p>Please make sure you have enabled pop-ups in your browser settings for this extension to work properly.</p>
                 <img src="${popupImageUrl}" alt="Enable Pop-ups" style="max-width:100%; height:auto; margin-top:10px;">`,
          icon: "warning",
          confirmButtonText: "OK, I have enabled pop-ups",
          allowEscapeKey: false,
          allowOutsideClick: false,
        });

        chrome.storage.local.set({ __uc: true });
      }
    }

    // Handle job search functionality
    if (isJobSearchPage) {
      await getCandidateId();
      if (isAutoApplyEnabled) {
        startJobSearch();
        return;
      }
    }
  }

  // Fetch available jobs
  async function fetchAvailableJobs(): Promise<void> {
    try {
      if (!isOnJobSearchPage()) return;
      if (typeof isAutoApplyEnabled === "undefined" || !isAutoApplyEnabled)
        return;

      // Show fetching toast
      Swal.fire({
        toast: true,
        position: "bottom-start",
        timer: toastDuration,
        showConfirmButton: false,
        timerProgressBar: true,
        html: '<span style="color: white;">Fetching Jobs...</span>',
      });

      // Build job type filter
      const jobTypeFilter: FilterItem[] =
        jobType !== "Any" ? [{ key: "jobType", val: [jobType as string] }] : [];

      const currentDate: string = new Date().toISOString().split("T")[0];

      // GraphQL query payload
      const queryPayload: GraphQLQuery = {
        operationName: "searchJobCardsByLocation",
        variables: {
          searchJobRequest: {
            locale: "en-CA",
            country: "Canada",
            keyWords: "",
            equalFilters: [],
            containFilters: [
              { key: "isPrivateSchedule", val: ["false"] },
              ...jobTypeFilter,
            ],
            rangeFilters: [
              {
                key: "hoursPerWeek",
                range: { minimum: 0, maximum: 80 },
              },
            ],
            orFilters: [],
            dateFilters: [
              {
                key: "firstDayOnSite",
                range: { startDate: currentDate },
              },
            ],
            sorters: [],
            pageSize: 100,
            geoQueryClause: {
              lat: latitude,
              lng: longitude,
              unit: "km",
              distance: parseInt(searchDistance.toString()) || 5,
            },
            consolidateSchedule: true,
          },
        },
        query: `query searchJobCardsByLocation($searchJobRequest: SearchJobRequest!) {
          searchJobCardsByLocation(searchJobRequest: $searchJobRequest) {
            nextToken
            jobCards {
              jobId
              jobTitle
              city
              distance
            }
          }
        }`,
      };

      // Make API request
      const response: Response = await fetch(
        "https://e5mquma77feepi2bdn4d6h3mpu.appsync-api.us-east-1.amazonaws.com/graphql",
        {
          method: "POST",
          headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.7",
            authorization: "Bearer <TOKEN>",
            "content-type": "application/json",
            country: "Canada",
            iscanary: "false",
            priority: "u=1, i",
            "sec-ch-ua":
              '"Brave";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"macOS"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "sec-gpc": "1",
          },
          body: JSON.stringify(queryPayload),
        },
      );

      const responseData: JobSearchResponse = await response.json();
      const jobCards: JobCard[] =
        responseData.data.searchJobCardsByLocation.jobCards;

      if (jobCards && jobCards.length > 0) {
        Swal.fire({
          toast: true,
          position: "bottom-start",
          timer: toastDuration,
          showConfirmButton: false,
          timerProgressBar: true,
          html: '<span style="color: green;">Found a Job, now we will match city</span>',
        });

        stopJobSearch();
        processFoundJobs(jobCards);
      }
    } catch (error) {
      console.error("Error fetching job listings:", error);
    }
  }

  // Get candidate ID from contact information
  async function getCandidateId(): Promise<void> {
    if (!candidateId) {
      window.location.href = "https://hiring.amazon.ca/app#/contactInformation";
      await waitForEmailField();

      const emailInput = document.querySelector(
        'input[data-test-id="input-test-id-emailId"]',
      ) as HTMLInputElement;
      if (emailInput && emailInput.value) {
        const emailValue: string = emailInput.value;
        chrome.storage.local.set(
          { candidateID: emailValue },
          function (): void {
            window.location.href = "https://hiring.amazon.ca/app#/jobSearch";
          },
        );
      }
    }
  }

  // Check if currently on job search page
  function isOnJobSearchPage(): boolean {
    const currentUrl: string = window.location.href;
    const jobSearchUrl: string = "https://hiring.amazon.ca/app#/jobSearch";
    return currentUrl.includes(jobSearchUrl);
  }

  // Process found jobs and check city matching
  async function processFoundJobs(jobCards: JobCard[]): Promise<void> {
    const storageData: any = await chrome.storage.local.get(["cityTags"]);
    const cityTags: string[] = storageData.cityTags || [];

    if (cityTags.length === 0) return;

    // Process city tags for matching
    const processedCityTags: string[] = cityTags.map((tag: string) =>
      tag.toLowerCase().replace(/[^a-zA-Z]/g, ""),
    );

    let matchedJob: JobCard | null = null;

    // Check each job for city match
    for (const job of jobCards) {
      if (!job.city) {
        const updatedStorageData: any = await chrome.storage.local.get([
          "cityTags",
        ]);
        const updatedCityTags: string[] = updatedStorageData.cityTags || [];
        const additionalProcessedTags: string[] = updatedCityTags.map(
          (tag: string) => tag.toLowerCase().replace(/[^a-zA-Z]/g, ""),
        );
        processedCityTags.push(...additionalProcessedTags);
      }

      if (job.city) {
        const processedJobCity: string = job.city
          .toLowerCase()
          .replace(/[^a-zA-Z]/g, "");
        if (
          processedCityTags.some((tag: string) =>
            processedJobCity.includes(tag),
          )
        ) {
          // Play notification sound
          chrome.runtime.sendMessage({ action: "playSound" });
          matchedJob = job;
          break;
        }
      }
    }

    if (matchedJob) {
      const jobDetailUrl: string = `https://hiring.amazon.ca/app#/jobDetail?jobId=${matchedJob.jobId}&locale=en-CA`;
      window.location.href = jobDetailUrl;
      handleJobDetailPage();
    } else {
      // Start job search interval if not already running
      if (!jobSearchInterval) {
        jobSearchInterval = setInterval((): void => {
          if (isAutoApplyEnabled) {
            fetchAvailableJobs();
          } else {
            if (jobSearchInterval) {
              clearInterval(jobSearchInterval);
              jobSearchInterval = null;
            }
          }
        }, toastDuration);
      }
    }
  }

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
        const scheduleCards = document.querySelectorAll(
          ".scheduleCardLabelText",
        );
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

  // Start job search process
  async function startJobSearch(): Promise<void> {
    if (!jobSearchInterval) {
      if (!username) {
        window.location.href = "https://auth.hiring.amazon.com/#/login";
        return;
      }

      if (username) {
        window.location.href =
          "https://hiring.amazon.ca/app#/contactInformation";
        await waitForEmailField();

        const emailInput = document.querySelector(
          'input[data-test-id="input-test-id-emailId"]',
        ) as HTMLInputElement;

        if (emailInput && emailInput.value) {
          window.location.href = "https://hiring.amazon.ca/app#/jobSearch";
        }

        // Start job search interval
        if (isAutoApplyEnabled && !jobSearchInterval) {
          jobSearchInterval = setInterval((): void => {
            if (isAutoApplyEnabled) {
              fetchAvailableJobs();
            } else {
              if (jobSearchInterval) {
                clearInterval(jobSearchInterval);
                jobSearchInterval = null;
              }
            }
          }, toastDuration);
        }
      }
    }
  }

  // Stop job search
  function stopJobSearch(): void {
    if (jobSearchInterval) {
      clearInterval(jobSearchInterval);
      jobSearchInterval = null;
    }
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener(function (
    message: RuntimeMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void,
  ): void {
    if (message.action === "activate") {
      isAutoApplyEnabled = message.status || false;
      if (isAutoApplyEnabled) {
        handleApplicationFlow();
      }
    }
    sendResponse(true);
  });

  // Establish connection with background script
  const backgroundConnection = chrome.runtime.connect({
    name: "amazon-shifts-extension",
  });

  backgroundConnection.onMessage.addListener(async function (
    message: RuntimeMessage,
  ): Promise<void> {
    if (message.action === "fetch_info" && message.data) {
      // Update configuration from background script
      username = message.data.$username;
      password = message.data.$password;
      candidateId = message.data.$candidateID;
      selectedCity = message.data.$selectedCity;
      latitude = message.data.$lat;
      longitude = message.data.$lng;
      searchDistance = message.data.$distance;
      jobType = message.data.$jobType;
      isAutoApplyEnabled = message.data.$active;

      if (isAutoApplyEnabled) {
        await handleApplicationFlow();
      }
    }
  });

  // Request initial configuration
  backgroundConnection.postMessage({
    action: "fetch_info",
  });
})(location.pathname);
