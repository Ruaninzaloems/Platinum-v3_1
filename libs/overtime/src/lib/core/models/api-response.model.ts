export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  message: string;
  errors: string[];
  timestamp: string;
}
