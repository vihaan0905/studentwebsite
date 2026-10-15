export interface Course {
  id: string;
  course_id: string;
  course_name: string;
  department: string;
  duration_years: number;
  num_semesters: number;
  created_at: string;
}

export interface Subject {
  id: string;
  subject_code: string;
  subject_name: string;
  course_id: string;
  semester: number;
  credits: number;
  faculty: string;
  created_at: string;
}

export interface Student {
  id: string;
  student_id: string;
  enrollment_number: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  gender: string;
  address: string;
  photo_url: string;
  course_id: string | null;
  semester: number;
  section: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  subject_id: string;
  total_classes: number;
  attended_classes: number;
  created_at: string;
}

export interface Mark {
  id: string;
  student_id: string;
  subject_id: string;
  internal_marks: number;
  assignment_marks: number;
  examination_marks: number;
  created_at: string;
}

export interface Assignment {
  id: string;
  student_id: string;
  subject_id: string;
  title: string;
  status: string;
  submitted_at: string | null;
  marks: number;
  max_marks: number;
  created_at: string;
}

export interface SubjectWithCourse extends Subject {
  courses?: Course;
}

export interface StudentWithCourse extends Student {
  courses?: Course;
}

export interface AttendanceWithSubject extends Attendance {
  subjects?: Subject;
}

export interface MarkWithSubject extends Mark {
  subjects?: Subject;
}

export interface AssignmentWithSubject extends Assignment {
  subjects?: Subject;
}

export interface StudentDetail extends StudentWithCourse {
  attendance?: AttendanceWithSubject[];
  marks?: MarkWithSubject[];
  assignments?: AssignmentWithSubject[];
}
