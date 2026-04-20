import { useEffect } from "react";

// Sets the browser tab title for each page
// Always appends "OHS CRM" as the brand suffix
export const usePageTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} — OHS CRM` : "OHS CRM";
    return () => {
      document.title = "OHS CRM";
    };
  }, [title]);
};