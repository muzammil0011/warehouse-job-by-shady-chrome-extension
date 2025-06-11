import { useAntd } from "@/providers/ThemeProvider";
import { Modal } from "antd";
import { useState } from "react";
import { sendMessage } from "webext-bridge/content-script";

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

const JobSearch = () => {
  const { settings, saveSettings } = useSettings();
  const { message, notification } = useAntd();
  const [modalVisible, setModalVisible] = useState(false);
  const jobSearchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!settings) return;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    if (settings.botStatus && settings?.lastModalDate !== today) {
      saveSettings({ lastModalDate: today });
      setModalVisible(true);
    }

    if (settings.botStatus) {
      // Start job search interval
      if (!jobSearchIntervalRef.current) {
        jobSearchIntervalRef.current = setInterval(async () => {
          if (settings.botStatus) {
            await fetchAvailableJobs(settings);
          } else {
            stopJobSearch();
          }
        }, settings.randomInterval);
      }
    } else {
      stopJobSearch();
    }

    return () => stopJobSearch();
  }, [settings]);

  async function fetchAvailableJobs(
    settings: Record<string, any> | Settings,
  ): Promise<void> {
    try {
      const { jobType, lng, lat, distance } = settings;
      message.loading("Fetching Jobs...", 0.2);

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
              lat,
              lng,
              unit: "km",
              distance: parseInt(distance.toString()) || 5,
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
        stopJobSearch();
        notification.success({
          message: "Found a Job, now we will match city",
        });

        processFoundJobs(jobCards, settings);
      }
    } catch (error) {
      console.error("Error fetching job listings:", error);
    }
  }

  // Process found jobs and check city matching
  async function processFoundJobs(
    jobCards: JobCard[],
    settings: Record<string, any> | Settings,
  ): Promise<void> {
    const cityTags: string[] = settings.cityTags || [];

    if (cityTags.length === 0) return;

    // Process city tags for matching
    const processedCityTags: string[] = cityTags.map((tag: string) =>
      tag.toLowerCase().replace(/[^a-zA-Z]/g, ""),
    );

    let matchedJob: JobCard | null = null;

    // Check each job for city match
    for (const job of jobCards) {
      if (!job.city) {
        const updatedCityTags: string[] = settings.cityTags || [];
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
          sendMessage("PLAY_SOUND", {});
          matchedJob = job;
          break;
        }
      }
    }

    if (matchedJob) {
      stopJobSearch();
      const jobDetailUrl: string = `https://hiring.amazon.ca/app#/jobDetail?jobId=${matchedJob.jobId}&locale=en-CA`;
      window.location.href = jobDetailUrl;
      sendMessage("START_AUTOFLOW", {});
    } else {
      // Start job search interval if not already running
      if (!jobSearchIntervalRef.current) {
        jobSearchIntervalRef.current = setInterval((): void => {
          if (settings.botStatus) {
            fetchAvailableJobs(settings);
          } else {
            stopJobSearch();
          }
        }, settings.randomInterval);
      }
    }
  }

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
