export type ApiResponseBody<TData> = {
  code: number;
  message: string;
  data: TData;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  isLast: boolean;
};

export type PaginatedApiResponseBody<TData> = ApiResponseBody<TData> & {
  pagination: PaginationMeta;
};

export type AlreadyWrappedResponse<TData = unknown> =
  | ApiResponseBody<TData>
  | PaginatedApiResponseBody<TData>;
