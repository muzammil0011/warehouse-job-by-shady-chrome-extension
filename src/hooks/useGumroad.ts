import { useCallback, useEffect, useState } from "react";

export function useLicenseVerification(productPermalink: string) {
  const [status, setStatus] = useState("idle"); // 'idle' | 'verifying' | 'verified' | 'invalid' | 'error'
  const [loading, setLoading] = useState(false);

  // Load saved status on mount
  useEffect(() => {
    chrome.storage.local.get(["isLicensed"], (result) => {
      if (result.isLicensed === true) {
        setStatus("verified");
      }
    });
  }, []);

  // Verify license with Gumroad
  const verify = useCallback(
    async ({ licenseKey }: { licenseKey: string }) => {
      if (!licenseKey || !productPermalink) {
        setStatus("error");
        return;
      }

      setLoading(true);
      setStatus("verifying");

      try {
        const response = await fetch(
          "https://api.gumroad.com/v2/licenses/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              product_permalink: productPermalink,
              license_key: licenseKey,
            }),
          },
        );

        const data = await response.json();

        if (data.success) {
          setStatus("verified");
          chrome.storage.local.set({ isLicensed: true });
        } else {
          setStatus("invalid");
          chrome.storage.local.set({ isLicensed: false });
        }
      } catch (error) {
        console.error("License verification error:", error);
        setStatus("error");
      } finally {
        setLoading(false);
      }
    },
    [productPermalink],
  );

  // Reset license status
  const reset = useCallback(() => {
    chrome.storage.local.remove("isLicensed", () => {
      setStatus("idle");
    });
  }, []);

  return {
    status,
    loading,
    verify,
    reset,
  };
}
