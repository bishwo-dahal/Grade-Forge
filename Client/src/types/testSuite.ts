export interface TestCaseItem {
  id?: number;
  title: string;
  isPrivate: boolean;
  /** Input content: stdin if fileName is null, else file content. */
  input: string;
  /** If set, input is file content (use this name when creating the file for the program). If null, input is console/stdin. */
  fileName: string | null;
  output: string;
}

export interface TestSuiteDetail {
  id: number;
  title: string;
  description: string | null;
  assignmentId: number;
  testCases: TestCaseItem[];
}

export interface TestSuitePayload {
  title: string;
  description: string;
  testCases: Array<{
    title: string;
    isPrivate: boolean;
    input: string;
    fileName: string | null;
    output: string;
  }>;
}
