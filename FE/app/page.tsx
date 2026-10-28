"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  BookOpen, Building2, ChartNoAxesColumn, ChevronDown, GraduationCap,
  LayoutDashboard, LogOut, MoreVertical, Pencil, Plus, Search, School,
  ShieldCheck, Trash2, Users, X,
} from "lucide-react";

type StudentStatus =
  | "STUDYING"
  | "SUSPENDED"
  | "RESERVED"
  | "GRADUATED"
  | "DROPPED_OUT"
  | "EXPELLED";

type Student = {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  status: StudentStatus;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/$/, "");
const STATUS_LABELS: Record<StudentStatus, string> = {
  STUDYING: "Đang học",
  SUSPENDED: "Tạm đình chỉ",
  RESERVED: "Bảo lưu",
  GRADUATED: "Đã tốt nghiệp",
  DROPPED_OUT: "Đã thôi học",
  EXPELLED: "Bị buộc thôi học",
};

const navItems = [
  { label: "Tổng quan", icon: LayoutDashboard, available: false },
  { label: "Quản lý sinh viên", icon: Users, available: true },
  { label: "Quản lý lớp", icon: School, available: false },
  { label: "Quản lý khoa", icon: Building2, available: false },
  { label: "Quản lý khóa học", icon: GraduationCap, available: false },
  { label: "Quản lý môn học", icon: BookOpen, available: false },
  { label: "Thống kê", icon: ChartNoAxesColumn, available: false },
];

export default function Page() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [authHeader, setAuthHeader] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [keyword, setKeyword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState<StudentStatus>("STUDYING");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    if (!authHeader) throw new Error("Vui lòng đăng nhập bằng tài khoản admin.");
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { Authorization: authHeader, "Content-Type": "application/json", ...init.headers },
    });
    if (response.status === 401 || response.status === 403) {
      throw new Error("Đăng nhập không thành công hoặc tài khoản không có quyền.");
    }
    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Yêu cầu thất bại (HTTP ${response.status})`);
    }
    if (response.status === 204) return null;
    return response.json();
  }, [authHeader]);

  const loadStudents = useCallback(async (search = "") => {
    const query = search.trim() ? `?keyword=${encodeURIComponent(search.trim())}` : "";
    const data = await request(`/api/students${query}`);
    setStudents(data as Student[]);
  }, [request]);

  useEffect(() => {
    if (!authHeader) return;
    loadStudents("").catch((e: Error) => setError(e.message));
  }, [authHeader, loadStudents]);

  const countLabel = useMemo(() => `${students.length} sinh viên`, [students.length]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const nextHeader = `Basic ${btoa(`${username}:${password}`)}`;
    try {
      const response = await fetch(`${API_BASE}/api/students`, { headers: { Authorization: nextHeader } });
      if (response.status === 401 || response.status === 403) throw new Error("Sai tên đăng nhập hoặc mật khẩu admin.");
      if (!response.ok) throw new Error(`Không kết nối được backend (HTTP ${response.status}).`);
      setStudents(await response.json());
      setAuthHeader(nextHeader);
      setMessage("Đăng nhập thành công.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể đăng nhập.");
    } finally {
      setBusy(false);
    }
  }

  function resetForm() {
    setFullName("");
    setEmail("");
    setPhoneNumber("");
    setStatus("STUDYING");
    setEditingId(null);
    setShowForm(false);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const body = { fullName: fullName.trim(), email: email.trim(), phoneNumber: phoneNumber.trim(), status };
      await request(editingId === null ? "/api/students" : `/api/students/${editingId}`, {
        method: editingId === null ? "POST" : "PUT",
        body: JSON.stringify(body),
      });
      await loadStudents(keyword);
      setMessage(editingId === null ? "Đã thêm sinh viên." : "Đã cập nhật sinh viên.");
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể lưu sinh viên.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(student: Student) {
    setEditingId(student.id);
    setFullName(student.fullName);
    setEmail(student.email);
    setPhoneNumber(student.phoneNumber || "");
    setStatus(student.status);
    setError("");
    setMessage("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteStudent(student: Student) {
    if (!window.confirm(`Bạn có chắc muốn xóa sinh viên "${student.fullName}" không?`)) return;
    setError("");
    setMessage("");
    try {
      await request(`/api/students/${student.id}`, { method: "DELETE" });
      await loadStudents(keyword);
      setMessage("Đã xóa sinh viên.");
      if (editingId === student.id) resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể xóa sinh viên.");
    }
  }

  function logout() {
    setAuthHeader("");
    setPassword("");
    setStudents([]);
    resetForm();
    setMessage("");
    setError("");
  }

  if (!authHeader) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#e2e8f0] px-4 py-10">
        <section className="grid w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-2">
          <div className="flex flex-col justify-between bg-[#03182b] p-9 text-white md:p-12">
            <div>
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700"><GraduationCap size={30} /></div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-300">QLSV · Java Web</p>
              <h1 className="mt-4 text-3xl font-bold leading-tight">Hệ thống quản lý sinh viên</h1>
              <p className="mt-4 text-sm leading-7 text-slate-300">Quản lý tập trung dữ liệu khóa học, khoa, lớp hành chính và sinh viên.</p>
            </div>
            <p className="mt-12 text-xs text-slate-400">Cổng quản trị dành riêng cho Admin.</p>
          </div>
          <div className="p-8 md:p-12">
            <div className="mb-8">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><ShieldCheck size={23} /></div>
              <h2 className="text-2xl font-bold text-slate-900">Đăng nhập Admin</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Vui lòng đăng nhập để tiếp tục vào hệ thống.</p>
            </div>
            {(message || error) && <div role="status" className={`mb-4 rounded-lg border px-3 py-2.5 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || message}</div>}
            <form onSubmit={handleLogin} className="space-y-5">
              <label className="block text-sm font-semibold text-slate-700">Tên đăng nhập
                <input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" className="mt-2 w-full rounded-lg border border-slate-300 px-3.5 py-3 font-normal outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" placeholder="Nhập tên đăng nhập" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Mật khẩu
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="mt-2 w-full rounded-lg border border-slate-300 px-3.5 py-3 font-normal outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" placeholder="Nhập mật khẩu" />
              </label>
              <button disabled={busy} className="w-full rounded-lg bg-emerald-800 px-4 py-3 font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60">{busy ? "Đang kết nối..." : "Đăng nhập hệ thống"}</button>
            </form>
            <p className="mt-5 break-all text-xs text-slate-400">Backend: {API_BASE}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#e2e8f0] p-1.5 text-slate-900">
      <div className="flex min-h-[calc(100vh-12px)] overflow-hidden rounded-lg">
        <aside className="hidden w-[270px] shrink-0 flex-col bg-[#03182b] text-slate-200 md:flex">
          <div className="border-b border-slate-600/70 px-5 py-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-400 bg-slate-700 text-lg font-bold text-white">A</div>
            <p className="font-bold text-white">Quản trị viên</p>
            <p className="mt-1 text-xs text-slate-400">ADMINISTRATOR</p>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} type="button" disabled={!item.available} title={!item.available ? "Chức năng sẽ được kết nối khi có API tương ứng" : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm transition ${item.available ? "bg-emerald-800 font-semibold text-white" : "cursor-not-allowed text-slate-300/90 hover:bg-white/5"}`}>
                  <Icon size={18} strokeWidth={1.8} /><span>{item.label}</span>
                  {item.label === "Quản lý môn học" && <ChevronDown className="ml-auto" size={15} />}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-slate-700 p-4 text-xs text-slate-400">Quản lý sinh viên · Java Web</div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-[76px] items-center justify-between gap-4 rounded-lg bg-[#03182b] px-5 py-4 text-white md:px-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">Hệ thống quản lý</p>
              <h1 className="mt-1 text-lg font-bold sm:text-2xl">KHOA CÔNG NGHỆ THÔNG TIN</h1>
            </div>
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-300 bg-slate-600 font-bold">A</div>
              <button onClick={logout} title="Đăng xuất" className="rounded-lg p-2 transition hover:bg-white/10"><LogOut size={21} /></button>
            </div>
          </header>

          <section className="mt-2 flex-1 rounded-lg bg-[#e2e8f0] p-4 sm:p-6 lg:p-7">
            {(message || error) && <div role="status" className={`mb-4 rounded-lg border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || message}</div>}

            <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm"><Users size={17} /> Danh sách sinh viên</span>
                <h2 className="text-xl font-extrabold uppercase tracking-tight sm:text-2xl">Quản lý sinh viên</h2>
              </div>
              <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-slate-50"><Plus size={17} /> Thêm sinh viên</button>
            </div>

            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div><p className="font-bold">Danh sách sinh viên</p><p className="mt-1 text-xs text-slate-500">Hiện có {countLabel} trong kết quả.</p></div>
              <form onSubmit={(e) => { e.preventDefault(); loadStudents(keyword).catch((err: Error) => setError(err.message)); }} className="flex w-full gap-2 lg:max-w-xl">
                <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm theo họ tên hoặc email..." className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" /></div>
                <button className="rounded-lg bg-[#03182b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">Tìm kiếm</button>
                <button type="button" onClick={() => { setKeyword(""); loadStudents("").catch((err: Error) => setError(err.message)); }} className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50">Xóa</button>
              </form>
            </div>

            {showForm && <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="font-bold">{editingId === null ? "Thêm sinh viên mới" : `Cập nhật sinh viên #${editingId}`}</h3><p className="mt-1 text-sm text-slate-500">Nhập thông tin sinh viên bên dưới.</p></div><button onClick={resetForm} type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng biểu mẫu"><X size={18} /></button></div>
              <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="text-sm font-semibold">Họ và tên<input value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={120} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-emerald-700" placeholder="Nguyễn Văn A" /></label>
                <label className="text-sm font-semibold">Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-emerald-700" placeholder="sinhvien@example.com" /></label>
                <label className="text-sm font-semibold">Số điện thoại<input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-emerald-700" placeholder="0901234567" /></label>
                <label className="text-sm font-semibold">Trạng thái<select value={status} onChange={(e) => setStatus(e.target.value as StudentStatus)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-emerald-700">{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-4"><button disabled={busy} className="rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">{busy ? "Đang lưu..." : editingId === null ? "Lưu sinh viên" : "Lưu cập nhật"}</button><button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:bg-slate-50">Hủy</button></div>
              </form>
            </section>}

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-slate-800"><tr className="border-b border-slate-200"><th className="px-5 py-4 font-bold">Mã sinh viên</th><th className="px-5 py-4 font-bold">Họ và tên</th><th className="px-5 py-4 font-bold">Email</th><th className="px-5 py-4 font-bold">Số điện thoại</th><th className="px-5 py-4 font-bold">Tình trạng</th><th className="px-5 py-4 text-right font-bold">Thao tác</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => <tr key={student.id} className="transition hover:bg-slate-50/80">
                      <td className="px-5 py-4 font-mono text-slate-600">{student.id}</td>
                      <td className="px-5 py-4 font-semibold text-slate-900">{student.fullName}</td>
                      <td className="px-5 py-4 text-slate-600">{student.email}</td>
                      <td className="px-5 py-4 text-slate-600">{student.phoneNumber || "—"}</td>
                      <td className="px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${student.status === "STUDYING" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{STATUS_LABELS[student.status] || student.status}</span></td>
                      <td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => startEdit(student)} aria-label="Sửa sinh viên" className="rounded-md p-2 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"><Pencil size={16} /></button><button onClick={() => deleteStudent(student)} aria-label="Xóa sinh viên" className="rounded-md p-2 text-slate-600 hover:bg-red-50 hover:text-red-700"><Trash2 size={16} /></button><button type="button" aria-label="Thao tác khác" onClick={() => startEdit(student)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><MoreVertical size={16} /></button></div></td>
                    </tr>)}
                    {students.length === 0 && <tr><td colSpan={6} className="px-5 py-16 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Users size={22} /></div><p className="font-semibold text-slate-700">Chưa có dữ liệu sinh viên</p><p className="mt-1 text-sm text-slate-500">Thử xóa bộ lọc hoặc thêm sinh viên mới.</p></td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><span>Đang hiển thị {students.length} sinh viên</span><span>Giới hạn lớp theo nghiệp vụ: tối đa 50 sinh viên/lớp</span></div>
            </section>
            <footer className="py-6 text-center text-xs text-slate-500">Bài tập lớn Công nghệ Java · Quản lý sinh viên</footer>
          </section>
        </div>
      </div>
    </main>
  );
}
