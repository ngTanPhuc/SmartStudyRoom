import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Mail,
  Phone,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { adminApi, AdminUserSummary, UserProfilePayload } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimestamp } from '@/utils/helpers';
import { PaginationControls } from '@/components/common/PaginationControls';

interface UserForm {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

const emptyForm: UserForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
};

const safeDate = (value?: string) => {
  if (!value) return 'Chưa có dữ liệu';
  return formatTimestamp(value);
};

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUserSummary | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      setUsers(await adminApi.getUsers());
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      return;
    }

    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    setPage(1);
  }, [query, pageSize]);

  const stats = useMemo(() => {
    const adminCount = users.filter((item) => item.roles?.includes('ADMIN')).length;
    return {
      total: users.length,
      admin: adminCount,
      normal: users.length - adminCount,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;

    return users.filter((item) => {
      return [
        item.fullName,
        item.email,
        item.phone,
        item.id,
        ...(item.roles || []),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [users, query]);

  const totalPages = Math.max(Math.ceil(filteredUsers.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const pagedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const startEdit = (targetUser: AdminUserSummary) => {
    setEditingUser(targetUser);
    setForm({
      firstName: targetUser.firstName || '',
      middleName: targetUser.middleName || '',
      lastName: targetUser.lastName || '',
      email: targetUser.email || '',
      phone: targetUser.phone || '',
      password: '',
    });
    setError(null);
    setSuccess(null);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setForm(emptyForm);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingUser) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: UserProfilePayload = {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password || undefined,
      };

      await adminApi.updateUser(editingUser.id, payload);
      setSuccess('Đã cập nhật thông tin người dùng');
      cancelEdit();
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể cập nhật người dùng');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (targetUser: AdminUserSummary) => {
    setError(null);
    setSuccess(null);

    if (targetUser.id === user?.id) {
      setError('Không thể xóa chính tài khoản admin đang đăng nhập');
      return;
    }

    const confirmed = window.confirm(`Xóa người dùng ${targetUser.fullName || targetUser.email}?`);
    if (!confirmed) return;

    try {
      await adminApi.deleteUser(targetUser.id);
      setSuccess('Đã xóa người dùng');
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể xóa người dùng');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm dark:border-red-900 dark:bg-slate-900">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h1 className="text-xl font-bold text-slate-950 dark:text-white">Không có quyền admin</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Trang này chỉ dành cho tài khoản có vai trò ADMIN.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-5 px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            Quay lại Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                aria-label="Quay lại bảng điều khiển"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Quản trị hệ thống</p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Bảng điều khiển Admin
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Quản lý danh sách người dùng và thông tin tài khoản.
                </p>
              </div>
            </div>

            <button
              onClick={loadUsers}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">Tổng người dùng</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-950 dark:text-white">{stats.total}</span>
              <Users className="w-6 h-6 text-slate-400" />
            </div>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5 shadow-sm dark:border-indigo-900 dark:bg-indigo-950/30">
            <p className="text-sm text-indigo-700 dark:text-indigo-300">Admin</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{stats.admin}</span>
              <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
            </div>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/30">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">Người dùng thường</p>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{stats.normal}</span>
              <UserRound className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
            </div>
          </div>
        </section>

        {(error || success) && (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              error
                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
            }`}
          >
            {error || success}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950 dark:text-white">Danh sách người dùng</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tìm kiếm, cập nhật hoặc xóa tài khoản.</p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Tìm theo tên, email, số điện thoại..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px]">
                <thead className="bg-slate-50 dark:bg-slate-950/60">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Người dùng</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Liên hệ</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Vai trò</th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ngày tạo</th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {loading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-sm text-slate-500 dark:text-slate-400">Đang tải người dùng...</td>
                    </tr>
                  )}

                  {!loading && pagedUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-sm text-slate-500 dark:text-slate-400">Không có người dùng phù hợp</td>
                    </tr>
                  )}

                  {!loading && pagedUsers.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-950 dark:text-white">{item.fullName || 'Chưa cập nhật tên'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 break-all">{item.id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                          <p className="inline-flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" />{item.email}</p>
                          <p className="inline-flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" />{item.phone || 'Chưa cập nhật'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {(item.roles || ['USER']).map((role) => (
                            <span
                              key={role}
                              className={`px-2 py-1 rounded-full text-xs font-bold ${
                                role === 'ADMIN'
                                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                              }`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-200">
                        {safeDate(item.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(item)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && (
              <PaginationControls
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredUsers.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            )}
          </section>

          <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm h-fit dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                  {editingUser ? 'Cập nhật người dùng' : 'Chọn người dùng'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {editingUser ? 'Chỉnh sửa thông tin tài khoản cơ bản.' : 'Bấm Sửa trong bảng để cập nhật.'}
                </p>
              </div>
              {editingUser && (
                <button
                  onClick={cancelEdit}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
                  aria-label="Hủy chỉnh sửa"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {editingUser ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Họ</label>
                  <input
                    value={form.lastName}
                    onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Tên lót</label>
                  <input
                    value={form.middleName}
                    onChange={(event) => setForm((prev) => ({ ...prev, middleName: event.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Tên</label>
                  <input
                    value={form.firstName}
                    onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Số điện thoại</label>
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Chưa cập nhật"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    placeholder="Bỏ trống nếu không đổi"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                <UserRound className="mx-auto mb-3 h-9 w-9 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-900 dark:text-white">Chưa chọn người dùng</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Chọn một dòng trong bảng để chỉnh sửa.</p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};
