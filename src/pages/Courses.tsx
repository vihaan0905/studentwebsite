import { useEffect, useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Pencil,
  Trash2,
  BookOpen,
  Users,
  Clock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState, TableSkeleton } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import type { Course, Subject, Student } from '@/types';

interface CourseWithCounts extends Course {
  subject_count?: number;
  student_count?: number;
}

export function CoursesPage() {
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<CourseWithCounts[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [form, setForm] = useState({ course_id: '', course_name: '', department: '', duration_years: '4', num_semesters: '8' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchData = async () => {
    const [coursesRes, subjectsRes, studentsRes] = await Promise.all([
      supabase.from('courses').select('*').order('course_name'),
      supabase.from('subjects').select('course_id'),
      supabase.from('students').select('course_id'),
    ]);
    const subjectCounts: Record<string, number> = {};
    (subjectsRes.data ?? []).forEach((s) => {
      if (s.course_id) subjectCounts[s.course_id] = (subjectCounts[s.course_id] ?? 0) + 1;
    });
    const studentCounts: Record<string, number> = {};
    (studentsRes.data ?? []).forEach((s) => {
      if (s.course_id) studentCounts[s.course_id] = (studentCounts[s.course_id] ?? 0) + 1;
    });
    const enriched = ((coursesRes.data as Course[]) ?? []).map((c) => ({
      ...c,
      subject_count: subjectCounts[c.id] ?? 0,
      student_count: studentCounts[c.id] ?? 0,
    }));
    setCourses(enriched);
    setSubjects((subjectsRes.data as Subject[]) ?? []);
    setStudents((studentsRes.data as Student[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.course_name.toLowerCase().includes(q) ||
        c.course_id.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
    );
  }, [courses, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ course_id: '', course_name: '', department: '', duration_years: '4', num_semesters: '8' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    setForm({
      course_id: course.course_id,
      course_name: course.course_name,
      department: course.department,
      duration_years: String(course.duration_years),
      num_semesters: String(course.num_semesters),
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.course_id.trim()) e.course_id = 'Course ID is required';
    if (!form.course_name.trim()) e.course_name = 'Course name is required';
    if (!form.department.trim()) e.department = 'Department is required';
    if (Number(form.duration_years) < 1) e.duration_years = 'Duration must be at least 1 year';
    if (Number(form.num_semesters) < 1) e.num_semesters = 'Must have at least 1 semester';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from('courses')
        .update({
          course_id: form.course_id.trim(),
          course_name: form.course_name.trim(),
          department: form.department.trim(),
          duration_years: Number(form.duration_years),
          num_semesters: Number(form.num_semesters),
        })
        .eq('id', editing.id);
      setSaving(false);
      if (error) {
        show('error', error.message.includes('duplicate') ? 'A course with this ID already exists.' : 'Failed to update course.');
        return;
      }
      show('success', 'Course updated successfully.');
    } else {
      const { error } = await supabase.from('courses').insert({
        course_id: form.course_id.trim(),
        course_name: form.course_name.trim(),
        department: form.department.trim(),
        duration_years: Number(form.duration_years),
        num_semesters: Number(form.num_semesters),
      });
      setSaving(false);
      if (error) {
        show('error', error.message.includes('duplicate') ? 'A course with this ID already exists.' : 'Failed to add course.');
        return;
      }
      show('success', 'Course added successfully.');
    }
    setModalOpen(false);
    fetchData();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('courses').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    if (error) {
      show('error', 'Failed to delete course.');
      return;
    }
    show('success', 'Course deleted successfully.');
    fetchData();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Courses</h1>
          <p className="text-sm text-slate-500 mt-1">Manage college courses and departments</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{courses.length}</p>
            <p className="text-sm text-slate-500">Total Courses</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-amber-50 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{subjects.length}</p>
            <p className="text-sm text-slate-500">Total Subjects</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Users className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{students.length}</p>
            <p className="text-sm text-slate-500">Enrolled Students</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No courses found"
            message={search ? "No courses match your search." : "No courses have been added yet. Click 'Add Course' to get started."}
            action={!search && <Button onClick={openAdd}><Plus className="h-4 w-4" />Add Course</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Course ID</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Course Name</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Department</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden sm:table-cell">Duration</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Semesters</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Subjects</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Students</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="text-sm font-mono font-medium text-slate-700">{course.course_id}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-sm font-semibold text-slate-800">{course.course_name}</span>
                    </td>
                    <td className="px-6 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-slate-600">{course.department}</span>
                    </td>
                    <td className="px-6 py-3.5 text-center hidden sm:table-cell">
                      <span className="text-sm text-slate-600">{course.duration_years} yrs</span>
                    </td>
                    <td className="px-6 py-3.5 text-center hidden lg:table-cell">
                      <span className="text-sm text-slate-600">{course.num_semesters}</span>
                    </td>
                    <td className="px-6 py-3.5 text-center hidden lg:table-cell">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">{course.subject_count ?? 0}</span>
                    </td>
                    <td className="px-6 py-3.5 text-center hidden lg:table-cell">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">{course.student_count ?? 0}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(course)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(course)} className="text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Course' : 'Add New Course'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Course'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Course ID" placeholder="e.g. CSE101" value={form.course_id} error={errors.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} />
          <Input label="Course Name" placeholder="e.g. B.Tech Computer Science" value={form.course_name} error={errors.course_name} onChange={(e) => setForm({ ...form, course_name: e.target.value })} />
          <div className="sm:col-span-2">
            <Input label="Department" placeholder="e.g. Computer Science & Engineering" value={form.department} error={errors.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <Input label="Duration (Years)" type="number" min="1" value={form.duration_years} error={errors.duration_years} onChange={(e) => setForm({ ...form, duration_years: e.target.value })} />
          <Input label="Number of Semesters" type="number" min="1" value={form.num_semesters} error={errors.num_semesters} onChange={(e) => setForm({ ...form, num_semesters: e.target.value })} />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteTarget?.course_name}"? This will also remove all subjects belonging to this course. This action cannot be undone.`}
        confirmLabel="Delete Course"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
