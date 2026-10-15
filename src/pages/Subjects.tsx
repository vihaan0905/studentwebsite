import { useEffect, useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState, TableSkeleton } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import type { Subject, Course } from '@/types';

type SubjectWithCourse = Subject & { courses?: Course };

export function SubjectsPage() {
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<SubjectWithCourse[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [form, setForm] = useState({ subject_code: '', subject_name: '', course_id: '', semester: '1', credits: '4', faculty: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchData = async () => {
    const [subjectsRes, coursesRes] = await Promise.all([
      supabase.from('subjects').select('*, courses(*)').order('subject_name'),
      supabase.from('courses').select('*').order('course_name'),
    ]);
    setSubjects((subjectsRes.data as SubjectWithCourse[]) ?? []);
    setCourses((coursesRes.data as Course[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return subjects.filter((s) => {
      const matchSearch = !q ||
        s.subject_name.toLowerCase().includes(q) ||
        s.subject_code.toLowerCase().includes(q) ||
        s.faculty.toLowerCase().includes(q);
      const matchCourse = !filterCourse || s.course_id === filterCourse;
      const matchSemester = !filterSemester || String(s.semester) === filterSemester;
      return matchSearch && matchCourse && matchSemester;
    });
  }, [subjects, search, filterCourse, filterSemester]);

  const openAdd = () => {
    setEditing(null);
    setForm({ subject_code: '', subject_name: '', course_id: courses[0]?.id ?? '', semester: '1', credits: '4', faculty: '' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (subject: Subject) => {
    setEditing(subject);
    setForm({
      subject_code: subject.subject_code,
      subject_name: subject.subject_name,
      course_id: subject.course_id ?? '',
      semester: String(subject.semester),
      credits: String(subject.credits),
      faculty: subject.faculty,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.subject_code.trim()) e.subject_code = 'Subject code is required';
    if (!form.subject_name.trim()) e.subject_name = 'Subject name is required';
    if (!form.course_id) e.course_id = 'Please select a course';
    if (!form.faculty.trim()) e.faculty = 'Faculty name is required';
    if (Number(form.credits) < 1) e.credits = 'Credits must be at least 1';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from('subjects')
        .update({
          subject_code: form.subject_code.trim(),
          subject_name: form.subject_name.trim(),
          course_id: form.course_id,
          semester: Number(form.semester),
          credits: Number(form.credits),
          faculty: form.faculty.trim(),
        })
        .eq('id', editing.id);
      setSaving(false);
      if (error) {
        show('error', error.message.includes('duplicate') ? 'A subject with this code already exists.' : 'Failed to update subject.');
        return;
      }
      show('success', 'Subject updated successfully.');
    } else {
      const { error } = await supabase.from('subjects').insert({
        subject_code: form.subject_code.trim(),
        subject_name: form.subject_name.trim(),
        course_id: form.course_id,
        semester: Number(form.semester),
        credits: Number(form.credits),
        faculty: form.faculty.trim(),
      });
      setSaving(false);
      if (error) {
        show('error', error.message.includes('duplicate') ? 'A subject with this code already exists.' : 'Failed to add subject.');
        return;
      }
      show('success', 'Subject added successfully.');
    }
    setModalOpen(false);
    fetchData();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('subjects').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    if (error) {
      show('error', 'Failed to delete subject.');
      return;
    }
    show('success', 'Subject deleted successfully.');
    fetchData();
  };

  const availableSemesters = useMemo(() => {
    if (!filterCourse) return 8;
    const course = courses.find((c) => c.id === filterCourse);
    return course?.num_semesters ?? 8;
  }, [filterCourse, courses]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Subjects</h1>
          <p className="text-sm text-slate-500 mt-1">Manage subjects across all courses and semesters</p>
        </div>
        <Button onClick={openAdd} disabled={courses.length === 0}>
          <Plus className="h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {courses.length === 0 && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            You need to add at least one course before you can create subjects.
          </p>
        </Card>
      )}

      <Card>
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, code, or faculty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
          </div>
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.course_name}</option>
            ))}
          </select>
          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
          >
            <option value="">All Semesters</option>
            {Array.from({ length: availableSemesters }).map((_, i) => (
              <option key={i} value={i + 1}>Semester {i + 1}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No subjects found"
            message={search || filterCourse || filterSemester ? "No subjects match your filters." : "No subjects have been added yet. Click 'Add Subject' to get started."}
            action={!search && !filterCourse && !filterSemester && courses.length > 0 && (
              <Button onClick={openAdd}><Plus className="h-4 w-4" />Add Subject</Button>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Code</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Subject Name</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Course</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden sm:table-cell">Semester</th>
                  <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Credits</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Faculty</th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((subject) => (
                  <tr key={subject.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="text-sm font-mono font-medium text-slate-700">{subject.subject_code}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-sm font-semibold text-slate-800">{subject.subject_name}</span>
                    </td>
                    <td className="px-6 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-slate-600">{subject.courses?.course_name ?? '—'}</span>
                    </td>
                    <td className="px-6 py-3.5 text-center hidden sm:table-cell">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">Sem {subject.semester}</span>
                    </td>
                    <td className="px-6 py-3.5 text-center hidden lg:table-cell">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{subject.credits} cr</span>
                    </td>
                    <td className="px-6 py-3.5 hidden lg:table-cell">
                      <span className="text-sm text-slate-600">{subject.faculty}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(subject)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(subject)} className="text-red-600 hover:bg-red-50">
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
        title={editing ? 'Edit Subject' : 'Add New Subject'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Subject'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Subject Code" placeholder="e.g. CS301" value={form.subject_code} error={errors.subject_code} onChange={(e) => setForm({ ...form, subject_code: e.target.value })} />
          <Input label="Subject Name" placeholder="e.g. Data Structures" value={form.subject_name} error={errors.subject_name} onChange={(e) => setForm({ ...form, subject_name: e.target.value })} />
          <div className="sm:col-span-2">
            <Select label="Course" value={form.course_id} error={errors.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.course_name}</option>
              ))}
            </Select>
          </div>
          <Select label="Semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
            {Array.from({ length: 8 }).map((_, i) => (
              <option key={i} value={i + 1}>Semester {i + 1}</option>
            ))}
          </Select>
          <Input label="Credits" type="number" min="1" value={form.credits} error={errors.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
          <div className="sm:col-span-2">
            <Input label="Faculty" placeholder="e.g. Dr. Rajesh Kumar" value={form.faculty} error={errors.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Subject"
        message={`Are you sure you want to delete "${deleteTarget?.subject_name}"? This will also remove related attendance, marks, and assignment records. This action cannot be undone.`}
        confirmLabel="Delete Subject"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
