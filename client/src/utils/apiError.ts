import { AxiosError } from "axios";

export const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return (
      error.response?.data?.error ||
      error.response?.data?.message ||
      "API request failed"
    );
  }
  return "Unexpected error occurred";
};