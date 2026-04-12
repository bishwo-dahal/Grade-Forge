// NOTE: Mirrors backend MainGroup → SubGroup → students contract for course groups.

export interface GroupStudentResponse {
  id: number;
  name: string;
  email: string;
  cwid: string;
}

export interface SubGroupResponse {
  id: number;
  name: string;
  students: GroupStudentResponse[];
}

export interface MainGroupResponse {
  id: number;
  name: string;
  subGroups: SubGroupResponse[];
}
