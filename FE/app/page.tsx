"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

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
  SUSPENDED: "Đình chỉ",
  RESERVED: "Bảo lưu",
  GRADUATED: "Đã tốt nghiệp",
  DROPPED_OUT: "Đã thôi học",
  EXPELLED: "Đã bị buộc thôi học",
};

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
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    if (!authHeader) throw new Error("Vui lòng đăng nhập bằng tài khoản admin.");
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        ...init.headers,
      },
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
      const response = await fetch(`${API_BASE}/api/students`, {
        headers: { Authorization: nextHeader },
      });
      if (response.status === 401 || response.status === 403) {
        throw new Error("Sai tên đăng nhập hoặc mật khẩu admin.");
      }
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
      await loadStudents();
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteStudent(student: Student) {
    if (!window.confirm(`Bạn có chắc muốn xóa sinh viên "${student.fullName}" không?`)) return;
    setError("");
    setMessage("");
    try {
      await request(`/api/students/${student.id}`, { method: "DELETE" });
      await loadStudents();
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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">QLSV · Java Web</p>
            <h1 className="mt-1 text-2xl font-bold">Quản lý sinh viên</h1>
          </div>
          {authHeader && (
            <button onClick={logout} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100">
              Đăng xuất
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {(message || error) && (
          <div role="status" className={`mb-5 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
            {error || message}
          </div>
        )}

        {!authHeader ? (
          <section className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold">Đăng nhập quản trị</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Đăng nhập bằng tài khoản admin được cấu hình ở backend Java.</p>
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <label className="block text-sm font-medium">Tên đăng nhập
                <input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <label className="block text-sm font-medium">Mật khẩu
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </label>
              <button disabled={busy} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
                {busy ? "Đang kết nối..." : "Đăng nhập"}
              </button>
            </form>
            <p className="mt-4 text-xs leading-5 text-slate-400">Backend: {API_BASE}</p>
          </section>
        ) : (
          <>
            <section className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Kết nối backend</p>
                <p className="mt-2 flex items-center gap-2 font-semibold text-emerald-700"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Đã đăng nhập</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Số sinh viên trong kết quả</p>
                <p className="mt-2 text-2xl font-bold">{countLabel}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">API đang sử dụng</p>
                <p className="mt-2 break-all text-sm font-semibold">{API_BASE}</p>
              </div>
            </section>

            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">{editingId === null ? "Thêm sinh viên" : `Cập nhật sinh viên #${editingId}`}</h2>
              <form onSubmit={handleSave} className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium">Họ và tên
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={120} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="Nguyễn Văn A" />
                </label>
                <label className="text-sm font-medium">Email
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="sinhvien@example.com" />
                </label>
                <label className="text-sm font-medium">Số điện thoại
                  <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500" placeholder="0901234567" />
                </label>
                <label className="text-sm font-medium">Trạng thái
                  <select value={status} onChange={(e) => setStatus(e.target.value as StudentStatus)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500">
                    {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <div className="flex flex-wrap gap-3 md:col-span-2">
                  <button disabled={busy} className="rounded-lg bg-blue-700 px-5 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{busy ? "Đang lưu..." : editingId === null ? "Thêm sinh viên" : "Lưu cập nhật"}</button>
                  {editingId !== null && <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold hover:bg-slate-100">Hủy sửa</button>}
                </div>
              </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 className="text-lg font-bold">Danh sách sinh viên</h2><p className="mt-1 text-sm text-slate-500">Tìm theo họ tên hoặc email.</p></div>
                <form onSubmit={(e) => { e.preventDefault(); loadStudents(keyword).catch((err: Error) => setError(err.message)); }} className="flex gap-2">
                  <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Nhập từ khóa..." className="min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                  <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100">Tìm</button>
                  <button type="button" onClick={() => { setKeyword(""); loadStudents("").catch((err: Error) => setError(err.message)); }} className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">Xóa lọc</button>
                </form>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="px-5 py-3">Mã</th><th className="px-5 py-3">Họ và tên</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Điện thoại</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3">Thao tác</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-mono text-slate-500">{student.id}</td>
                        <td className="px-5 py-4 font-semibold">{student.fullName}</td>
                        <td className="px-5 py-4">{student.email}</td>
                        <td className="px-5 py-4">{student.phoneNumber || "—"}</td>
                        <td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{STATUS_LABELS[student.status] || student.status}</span></td>
                        <td className="px-5 py-4"><div className="flex gap-3"><button onClick={() => startEdit(student)} className="font-semibold text-blue-700 hover:underline">Sửa</button><button onClick={() => deleteStudent(student)} className="font-semibold text-red-600 hover:underline">Xóa</button></div></td>
                      </tr>
                    ))}
                    {students.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Chưa có sinh viên. Hãy thêm sinh viên đầu tiên.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
        <footer className="py-8 text-center text-xs text-slate-400">Bài tập lớn Công nghệ Java · Quản lý sinh viên</footer>
      </div>
    </main>
  );
}
