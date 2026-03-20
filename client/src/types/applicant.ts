import type { components } from "@/types/api";

export type PgSearchRequest = components["schemas"]["PgSearchRequestDto"];

// The frontend component expects a richer object than the base PgSearchResponseDto.
// We extend the base type to include missing fields like totalRatings and imageUrl.
export type PgSearchResult = components["schemas"]["PgSearchResponseDto"] & {
  totalRatings?: number;
  imageUrl?: string;
};

export type PgSearchApiResponse = Omit<components["schemas"]["ApiResponseListPgSearchResponseDto"], "data"> & { data?: PgSearchResult[] };

export type PgDetailsResponse = components["schemas"]["PgWithRoomsResponseDto"];
export type PgDetailsApiResponse = components["schemas"]["ApiResponsePgWithRoomsResponseDto"];

export type VisitRequestResponse = components["schemas"]["VisitRequestResponseDto"];
export type VisitRequestListApiResponse = {
  success?: boolean;
  message?: string;
  data?: VisitRequestResponse[];
  timestamp?: string;
  errorCode?: string;
};

export type AmenityResponse = components["schemas"]["AmenityResponseDto"];

export type CreateVisitRequest = components["schemas"]["CreateVisitRequestDto"];
export type VisitRequestApiResponse = {
  success?: boolean;
  message?: string;
  data?: VisitRequestResponse;
  timestamp?: string;
  errorCode?: string;
};

export type BedResponse = components["schemas"]["BedResponseDto"];
export type BedListApiResponse = {
  success?: boolean;
  message?: string;
  data?: BedResponse[];
  timestamp?: string;
  errorCode?: string;
};