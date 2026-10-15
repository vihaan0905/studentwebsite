import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Hash,
  GraduationCap,
  BookOpen,
  Pencil,
  TrendingUp,
  Award,
  ClipboardList,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { FullPageLoader, EmptyState } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import type {
  Student,
  Course,
  Subject,
  Attendance,
  Mark,
  Assignment,
} from '@/types';

type Tab = 'overview' | 'attendance' | 'marks' | 'subjects' | 'assignments';

interface StudentProfileProps {
  studentId: string;
  onBack: () => void;
}

type StudentData = Student & {
  courses?: Course;
  attendance?: (Attendance & { subjects?: Subject })[];
  marks?: (Mark & { subjects?: Subject })[];
  assignments?: (Assignment & { subjects?: Subject })[];
};

export function StudentProfile({ studentId, onBack }: StudentProfileProps) {
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [studentRes, coursesRes] = await Promise.all([
        supabase
          .from('students')
          .select('*, courses(*), attendance(*, subjects(*)), marks(*, subjects(*)), assignments(*, subjects(*))')
          .eq('id', studentId)
          .maybeSingle(),
        supabase.from('courses').select('*').order('course_name'),
      ]);
      setStudent(studentRes.data as StudentData);
      setCourses((coursesRes.data as Course[]) ?? []);
      setLoading(false);
    })();
  }, [studentId]);

  if (loading) return <FullPageLoader />;
  if (!student) {
    return (
      <EmptyState
        icon={User}
        title="Student not found"
        message="The student you're looking for doesn't exist or has been removed."
        action={<Button onClick={onBack}>Back to Students</Button>}
      />
    );
  }

  // Compute academic summary
  const marks = student.marks ?? [];
  const totalInternal = marks.reduce((s, m) => s + Number(m.internal_marks), 0);
  const totalAssignment = marks.reduce((s, m) => s + Number(m.assignment_marks), 0);
  const totalExam = marks.reduce((s, m) => s + Number(m.examination_marks), 0);
  const maxPerSubject = 20 + 20 + 100; // internal(20) + assignment(20) + exam(100) = 140
  const overallPct = marks.length > 0
    ? Math.round(((totalInternal + totalAssignment + totalExam) / (marks.length * maxPerSubject)) * 100)
    : 0;
  const grade = getGrade(overallPct);

  const attendanceRecords = student.attendance ?? [];
  const totalClasses = attendanceRecords.reduce((s, a) => s + a.total_classes, 0);
  const attendedClasses = attendanceRecords.reduce((s, a) => s + a.attended_classes, 0);
  const attendancePct = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

  const subjects = student.marks
    ?.map((m) => m.subjects)
    .filter(Boolean) as Subject[] | undefined;

  const assignments = student.assignments ?? [];

  const openEdit = () => {
    setFormData({
      full_name: student.full_name,
      email: student.email,
      phone: student.phone,
      date_of_birth: student.date_of_birth ?? '',
      gender: student.gender,
      address: student.address,
      course_id: student.course_id ?? '',
      semester: String(student.semester),
      section: student.section,
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('students')
      .update({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender,
        address: formData.address,
        course_id: formData.course_id || null,
        semester: Number(formData.semester),
        section: formData.section,
      })
      .eq('id', student.id);

    setSaving(false);
    if (error) {
      show('error', 'Failed to update student profile.');
      return;
    }
    // Refetch
    const { data } = await supabase
      .from('students')
      .select('*, courses(*), attendance(*, subjects(*)), marks(*, subjects(*)), assignments(*, subjects(*))')
      .eq('id', studentId)
      .maybeSingle();
    setStudent(data as StudentData);
    setEditOpen(false);
    show('success', 'Student profile updated successfully.');
  };

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'marks', label: 'Marks', icon: Award },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </button>

      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-800" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div className="w-24 h-24 rounded-xl bg-white p-1 shadow-lg shrink-0">
              <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-3xl">
                {student.full_name.charAt(0)}
              </div>
            </div>
            <div className="flex-1 sm:pb-2">
              <h1 className="text-xl font-bold text-slate-800">{student.full_name}</h1>
              <p className="text-sm text-slate-500">
                {student.student_id} · {student.courses?.course_name ?? 'No course assigned'}
              </p>
            </div>
            <Button variant="secondary" onClick={openEdit}>
              <Pencil className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          student={student}
          attendancePct={attendancePct}
          overallPct={overallPct}
          grade={grade}
          totalSubjects={subjects?.length ?? 0}
          totalAssignments={assignments.length}
        />
      )}
      {activeTab === 'attendance' && (
        <AttendanceTab records={attendanceRecords} />
      )}
      {activeTab === 'marks' && (
        <MarksTab marks={marks} overallPct={overallPct} grade={grade} />
      )}
      {activeTab === 'subjects' && (
        <SubjectsTab subjects={subjects ?? []} />
      )}
      {activeTab === 'assignments' && (
        <AssignmentsTab assignments={assignments} />
      )}

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Student Profile"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" value={formData.full_name ?? ''} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
          <Input label="Email" type="email" value={formData.email ?? ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <Input label="Phone" value={formData.phone ?? ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          <Input label="Date of Birth" type="date" value={formData.date_of_birth ?? ''} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
          <Select label="Gender" value={formData.gender ?? ''} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </Select>
          <Select label="Course" value={formData.course_id ?? ''} onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}>
            <option value="">Select Course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.course_name}</option>
            ))}
          </Select>
          <Select label="Semester" value={formData.semester ?? ''} onChange={(e) => setFormData({ ...formData, semester: e.target.value })}>
            {Array.from({ length: 8 }).map((_, i) => (
              <option key={i} value={i + 1}>Semester {i + 1}</option>
            ))}
          </Select>
          <Select label="Section" value={formData.section ?? ''} onChange={(e) => setFormData({ ...formData, section: e.target.value })}>
            {['A', 'B', 'C', 'D'].map((s) => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </Select>
          <div className="sm:col-span-2">
            <TextArea label="Address" rows={2} value={formData.address ?? ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800 break-words">{value}</p>
      </div>
    </div>
  );
}

function OverviewTab({
  student,
  attendancePct,
  overallPct,
  grade,
  totalSubjects,
  totalAssignments,
}: {
  student: StudentData;
  attendancePct: number;
  overallPct: number;
  grade: string;
  totalSubjects: number;
  totalAssignments: number;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Student Information */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader title="Student Information" />
          <div className="px-6 py-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 divide-y divide-slate-50">
            <InfoRow icon={Hash} label="Student ID" value={student.student_id} />
            <InfoRow icon={Hash} label="Enrollment Number" value={student.enrollment_number} />
            <InfoRow icon={Mail} label="Email" value={student.email} />
            <InfoRow icon={Phone} label="Phone" value={student.phone || '—'} />
            <InfoRow icon={Calendar} label="Date of Birth" value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
            <InfoRow icon={User} label="Gender" value={student.gender} />
            <InfoRow icon={MapPin} label="Address" value={student.address || '—'} />
            <InfoRow icon={GraduationCap} label="Course" value={student.courses?.course_name ?? '—'} />
            <InfoRow icon={BookOpen} label="Semester" value={`Semester ${student.semester}`} />
            <InfoRow icon={BookOpen} label="Section" value={`Section ${student.section}`} />
          </div>
        </Card>
      </div>

      {/* Academic Summary */}
      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Overall Percentage</p>
              <p className="text-2xl font-bold text-slate-800">{overallPct}%</p>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Attendance</p>
              <p className="text-2xl font-bold text-slate-800">{attendancePct}%</p>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${attendancePct >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${attendancePct}%` }} />
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{grade}</p>
            <p className="text-xs text-slate-500 mt-1">Grade</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{totalSubjects}</p>
            <p className="text-xs text-slate-500 mt-1">Subjects</p>
          </Card>
        </div>

        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{totalAssignments}</p>
          <p className="text-xs text-slate-500 mt-1">Total Assignments</p>
        </Card>
      </div>
    </div>
  );
}

function AttendanceTab({ records }: { records: (Attendance & { subjects?: Subject })[] }) {
  if (records.length === 0) {
    return <EmptyState icon={Calendar} title="No attendance records" message="Attendance data hasn't been recorded for this student yet." />;
  }

  const totalClasses = records.reduce((s, a) => s + a.total_classes, 0);
  const attended = records.reduce((s, a) => s + a.attended_classes, 0);
  const overallPct = totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Overall Attendance</p>
            <p className="text-3xl font-bold text-slate-800">{overallPct}%</p>
            <p className="text-xs text-slate-400 mt-1">{attended} of {totalClasses} classes attended</p>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${overallPct >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {overallPct >= 75 ? 'Good Standing' : 'At Risk'}
          </div>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mt-4">
          <div className={`h-full rounded-full transition-all ${overallPct >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${overallPct}%` }} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Subject-wise Attendance" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Subject</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Attended</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Total</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Percentage</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((rec) => {
                const pct = rec.total_classes > 0 ? Math.round((rec.attended_classes / rec.total_classes) * 100) : 0;
                return (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="text-sm font-medium text-slate-800">{rec.subjects?.subject_name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{rec.subjects?.subject_code}</p>
                    </td>
                    <td className="px-6 py-3.5 text-center text-sm text-slate-600">{rec.attended_classes}</td>
                    <td className="px-6 py-3.5 text-center text-sm text-slate-600">{rec.total_classes}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="text-sm font-semibold text-slate-800">{pct}%</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${pct >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {pct >= 75 ? 'Good' : 'Low'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MarksTab({ marks, overallPct, grade }: { marks: (Mark & { subjects?: Subject })[]; overallPct: number; grade: string }) {
  if (marks.length === 0) {
    return <EmptyState icon={Award} title="No marks recorded" message="Marks data hasn't been entered for this student yet." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs text-slate-500">Overall Percentage</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{overallPct}%</p>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${overallPct}%` }} />
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-slate-500">Grade</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{grade}</p>
          <p className="text-xs text-slate-400 mt-3">{getGradeRemark(grade)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs text-slate-500">Subjects</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{marks.length}</p>
          <p className="text-xs text-slate-400 mt-3">Subjects with marks recorded</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Subject-wise Marks" subtitle="Internal (max 20) · Assignment (max 20) · Examination (max 100)" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Subject</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Internal</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Assignment</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Exam</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Total</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marks.map((mark) => {
                const total = Number(mark.internal_marks) + Number(mark.assignment_marks) + Number(mark.examination_marks);
                const pct = Math.round((total / maxPerSubject) * 100);
                const subjectGrade = getGrade(pct);
                return (
                  <tr key={mark.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="text-sm font-medium text-slate-800">{mark.subjects?.subject_name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{mark.subjects?.subject_code}</p>
                    </td>
                    <td className="px-6 py-3.5 text-center text-sm text-slate-600">{mark.internal_marks}</td>
                    <td className="px-6 py-3.5 text-center text-sm text-slate-600">{mark.assignment_marks}</td>
                    <td className="px-6 py-3.5 text-center text-sm text-slate-600">{mark.examination_marks}</td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="text-sm font-bold text-slate-800">{total}</span>
                      <span className="text-xs text-slate-400">/{maxPerSubject}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <GradeBadge grade={subjectGrade} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SubjectsTab({ subjects }: { subjects: Subject[] }) {
  if (subjects.length === 0) {
    return <EmptyState icon={BookOpen} title="No subjects enrolled" message="This student is not enrolled in any subjects yet." />;
  }

  return (
    <Card>
      <CardHeader title="Enrolled Subjects" subtitle={`${subjects.length} subjects`} />
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Code</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Subject Name</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Semester</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Credits</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Faculty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subjects.map((subject) => (
              <tr key={subject.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3.5">
                  <span className="text-sm font-mono font-medium text-slate-700">{subject.subject_code}</span>
                </td>
                <td className="px-6 py-3.5">
                  <span className="text-sm font-medium text-slate-800">{subject.subject_name}</span>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <span className="text-sm text-slate-600">Sem {subject.semester}</span>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{subject.credits} credits</span>
                </td>
                <td className="px-6 py-3.5">
                  <span className="text-sm text-slate-600">{subject.faculty}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AssignmentsTab({ assignments }: { assignments: (Assignment & { subjects?: Subject })[] }) {
  if (assignments.length === 0) {
    return <EmptyState icon={ClipboardList} title="No assignments" message="No assignments have been assigned to this student yet." />;
  }

  const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
    Submitted: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-700' },
    Pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 text-amber-700' },
    'Late Submission': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 text-red-700' },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {assignments.map((assignment) => {
        const config = statusConfig[assignment.status] ?? statusConfig.Pending;
        const StatusIcon = config.icon;
        const pct = assignment.max_marks > 0 ? Math.round((Number(assignment.marks) / Number(assignment.max_marks)) * 100) : 0;
        return (
          <Card key={assignment.id} className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{assignment.title}</p>
                  <p className="text-xs text-slate-500">{assignment.subjects?.subject_name ?? 'Unknown subject'}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 shrink-0 ${config.bg}`}>
                <StatusIcon className="h-3 w-3" />
                {assignment.status}
              </span>
            </div>
            {assignment.status === 'Submitted' ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">Score</span>
                  <span className="text-sm font-bold text-slate-800">{assignment.marks}/{assignment.max_marks}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Submitted on {new Date(assignment.submitted_at!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Not yet submitted</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = {
    A: 'bg-emerald-50 text-emerald-700',
    B: 'bg-blue-50 text-blue-700',
    C: 'bg-amber-50 text-amber-700',
    D: 'bg-orange-50 text-orange-700',
    F: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${colors[grade] ?? colors.C}`}>
      {grade}
    </span>
  );
}

function getGrade(pct: number): string {
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

function getGradeRemark(grade: string): string {
  const remarks: Record<string, string> = {
    A: 'Excellent performance',
    B: 'Very good performance',
    C: 'Good performance',
    D: 'Satisfactory',
    F: 'Needs improvement',
  };
  return remarks[grade] ?? '';
}

const maxPerSubject = 140;
