import { useAntd } from "@/providers/ThemeProvider";
import { Modal } from "antd";
import { useState } from "react";

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
  // geoQueryClause: GeoQuery;
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

const JobSearch = () => {
  const { settings, saveSettings } = useSettings();
  const { message, notification } = useAntd();
  const [modalVisible, setModalVisible] = useState(false);
  const jobSearchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const response = await fetch(
          "https://auth.hiring.amazon.com/api/csrf?countryCode=CA",
          {
            credentials: "include", // important if cookies are involved
          },
        );

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        message.error("Failed to fetch CSRF token. Please try again later.");
        console.log("Failed to fetch CSRF token:", err);
      }
    }

    fetchToken();
  }, []);

  useEffect(() => {
    if (!settings || !token) return;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    if (settings.botStatus && settings?.lastModalDate !== today) {
      saveSettings({ lastModalDate: today });
      setModalVisible(true);
    }

    if (settings.botStatus) {
      // Start job search interval
      if (!jobSearchIntervalRef.current) {
        jobSearchIntervalRef.current = setInterval(async () => {
          await fetchAvailableJobs(settings, token);
        }, settings.randomInterval);
      }
    } else {
      stopJobSearch();
    }

    return () => stopJobSearch();
  }, [settings, token]);

  async function fetchAvailableJobs(
    settings: Record<string, any> | Settings,
    token: string,
  ): Promise<void> {
    try {
      const { jobType, lng, lat, distance } = settings;

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
            rangeFilters: [],
            orFilters: [],
            dateFilters: [
              {
                key: "firstDayOnSite",
                range: { startDate: currentDate },
              },
            ],
            sorters: [],
            pageSize: 100,
            // geoQueryClause: {
            //   lat,
            //   lng,
            //   unit: "km",
            //   distance: parseInt(distance.toString()) || 5,
            // },
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
            authorization: "Bearer Status|unauthenticated|Session|" + token,
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
      if (response.ok) {
        message.loading("Fetching Jobs...", 0.2);
        const responseData: JobSearchResponse = await response.json();
        const jobCards: JobCard[] =
          responseData.data.searchJobCardsByLocation.jobCards;

        if (jobCards && jobCards.length > 0) {
          processFoundJobs(jobCards, settings, token);
          // stopJobSearch();
          notification.success({
            message: "Found a Job, now we will match city",
            description: `Found ${jobCards.length} job(s) matching your criteria.`,
          });
        }
      } else {
        console.log(`Request failed: ${response.statusText}`);
        message.error("Request failed. Please refresh the page");
      }
    } catch (error) {
      notification.error({
        message: "Error fetching job listings.",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Process found jobs and check city matching
  async function processFoundJobs(
    jobCards: JobCard[],
    settings: Record<string, any> | Settings,
    token: string,
  ): Promise<void> {
    const cityTags: string[] = settings.cityTags || [];

    // Normalize city tags
    const processedCityTags = cityTags.map((tag) =>
      tag.toLowerCase().replace(/[^a-zA-Z]/g, ""),
    );

    let matchedJob: JobCard | null = null;

    for (const job of jobCards) {
      const jobText = JSON.stringify(job)
        .toLowerCase()
        .replace(/[^a-zA-Z]/g, "");

      const isMatch =
        processedCityTags.length === 0 || // No tags? Match everything
        processedCityTags.some((tag) => jobText.includes(tag));

      if (isMatch) {
        matchedJob = job;
        break;
      }
    }

    if (matchedJob) {
      // 🔔 Play sound notification
      try {
        const alertSound = new Audio(
          browser.runtime.getURL("alert.wav" as any),
        );
        await alertSound.play();
      } catch (error) {
        const btn = document.createElement("button");
        btn.style.display = "none";
        document.body.appendChild(btn);
        btn.addEventListener("click", () => {
          new Audio(browser.runtime.getURL("alert.wav" as any)).play();
        });
        btn.click();
        document.body.removeChild(btn);
      }
      // 🧠 Check if tab is already open
      chrome.runtime.sendMessage({
        type: "queryTabs",
        jobId: matchedJob.jobId,
      });
    } else {
      // 🔁 Continue polling if no match
      if (!jobSearchIntervalRef.current) {
        jobSearchIntervalRef.current = setInterval(() => {
          if (settings.botStatus) {
            fetchAvailableJobs(settings, token);
          } else {
            stopJobSearch();
          }
        }, settings.randomInterval);
      }
    }
  }

  // async function processFoundJobs(
  //   jobCards: JobCard[],
  //   settings: Record<string, any> | Settings,
  //   token: string,
  // ): Promise<void> {
  //   const cityTags: string[] = settings.cityTags || [];

  //   if (cityTags.length === 0) return;

  //   // Process city tags for matching
  //   const processedCityTags: string[] = cityTags.map((tag: string) =>
  //     tag.toLowerCase().replace(/[^a-zA-Z]/g, ""),
  //   );

  //   let matchedJob: JobCard | null = null;

  //   // Check each job for city match
  //   for (const job of jobCards) {
  //     if (!job.city) {
  //       const updatedCityTags: string[] = settings.cityTags || [];
  //       const additionalProcessedTags: string[] = updatedCityTags.map(
  //         (tag: string) => tag.toLowerCase().replace(/[^a-zA-Z]/g, ""),
  //       );
  //       processedCityTags.push(...additionalProcessedTags);
  //     }

  //     if (job.city) {
  //       const processedJobCity: string = job.city
  //         .toLowerCase()
  //         .replace(/[^a-zA-Z]/g, "");
  //       if (
  //         processedCityTags.some((tag: string) =>
  //           processedJobCity.includes(tag),
  //         )
  //       ) {
  //         // Play notification sound
  //         console.log("Attempting to play sound...");
  //         const alertSound = new Audio(
  //           browser.runtime.getURL("alert.wav" as any),
  //         );
  //         alertSound
  //           .play()
  //           .then(() => {
  //             console.log("Sound played successfully.");
  //           })
  //           .catch((error) => {
  //             const btn = document.createElement("button");
  //             btn.style.display = "none";
  //             document.body.appendChild(btn);
  //             btn.addEventListener("click", () => {
  //               alertSound.play();
  //             });
  //             btn.click();
  //             document.body.removeChild(btn);
  //           });

  //         matchedJob = job;
  //         break;
  //       }
  //     }
  //   }

  //   if (matchedJob) {
  //     const jobDetailUrl: string = `https://hiring.amazon.ca/app#/jobDetail?jobId=${matchedJob.jobId}&locale=en-CA`;
  //     // window.location.href = jobDetailUrl;
  //     chrome.tabs.query({}, (tabs) => {
  //       const existingTab = tabs.find((tab) =>
  //         tab.url?.includes(matchedJob.jobId),
  //       );

  //       console.log(matchedJob.jobId);

  //       if (existingTab) {
  //         // Focus the existing tab
  //         chrome.tabs.update(existingTab.id!, { active: true });
  //       } else {
  //         // Create a new tab
  //         chrome.tabs.create({ url: jobDetailUrl });
  //       }
  //     });
  //     // stopJobSearch();
  //     // eventBus.emit("start-autoflow", { message: "Please Start Automation!" });
  //   } else {
  //     // Start job search interval if not already running
  //     if (!jobSearchIntervalRef.current) {
  //       jobSearchIntervalRef.current = setInterval((): void => {
  //         if (settings.botStatus) {
  //           fetchAvailableJobs(settings, token);
  //         } else {
  //           stopJobSearch();
  //         }
  //       }, settings.randomInterval);
  //     }
  //   }
  // }

  function stopJobSearch(): void {
    if (jobSearchIntervalRef.current) {
      clearInterval(jobSearchIntervalRef.current);
      jobSearchIntervalRef.current = null;
    }
  }

  return (
    <div>
      <Modal
        title="Turn on your pop-ups"
        open={modalVisible}
        closable
        maskClosable={false}
        onCancel={() => {
          setModalVisible(false);
        }}
        okButtonProps={{
          hidden: true,
        }}
        cancelButtonProps={{
          hidden: true,
        }}
      >
        <p>
          Please make sure you have{" "}
          <span className="underline">enabled pop-ups</span> in your browser
          settings for this extension to work properly.
        </p>
        <img
          src={chrome.runtime.getURL("assets/allow-popup.png")}
          alt="Enable Pop-ups"
          className="m-auto mt-4"
        />
      </Modal>
    </div>
  );
};

export default JobSearch;
