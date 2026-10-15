import { useEffect, useState, useMemo } from 'react';
import { Search, Eye, Users, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState, TableSkeleton } from '@/components/ui/Feedback';
import type { Student, Course } from '@/types';

type StudentWithCourse = Student & { courses?: Course };

interface StudentsListProps {
  onViewStudent: (id: string) => void;
}

const PAGE_SIZE = 8;

export function StudentsList({ onViewStudent }: StudentsListProps) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentWithCourse[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('students')
        .select('*, courses(*)')
        .order('full_name', { ascending: true });
      setStudents((data as StudentWithCourse[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        s.enrollment_number.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.courses?.course_name ?? '').toLowerCase().includes(q)
    );
  }, [students, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const currentData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Students</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and view all enrolled students</p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      <Card>
        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, email, or course..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : currentData.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students found"
            message={search ? "No students match your search. Try a different query." : "No students have been enrolled yet."}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Student</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">Student ID</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">Course</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 hidden sm:table-cell">Semester</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentData.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                            {student.full_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{student.full_name}</p>
                            <p className="text-xs text-slate-500 truncate">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-slate-600 font-mono">{student.student_id}</span>
                      </td>
                      <td className="px-6 py-3.5 hidden lg:table-cell">
                        <span className="text-sm text-slate-600">{student.courses?.course_name ?? '—'}</span>
                      </td>
                      <td className="px-6 py-3.5 hidden sm:table-cell">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Sem {student.semester} · Sec {student.section}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewStudent(student.id)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <span className="text-sm text-slate-600 px-2">
                    {page + 1} / {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
