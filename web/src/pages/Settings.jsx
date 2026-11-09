import { useState } from "react";
import { Camera } from "lucide-react";
import api, { errorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../context/UiContext";
import { Avatar, Field, PageTitle } from "../components/common";

export default function Settings() {
  const { user, setUser } = useAuth();
  const { toast, confirm } = useUi();
  const [profile, setProfile] = useState({ name: user.name, bio: user.bio || "" });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState("");

  function pickAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast("Ukuran foto maksimal 2 MB", "error");
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  }

  async function saveProfile(e) {
    e.preventDefault();
    if (!(await confirm({ title: "Simpan perubahan profil?", confirmText: "Simpan" }))) return;
    setBusy("profile");
    try {
      const form = new FormData();
      form.append("name", profile.name);
      form.append("bio", profile.bio);
      if (avatar) form.append("avatar", avatar);
      const res = await api.patch("/profile", form);
      setUser(res.data);
      setAvatar(null);
      toast("Profil berhasil disimpan");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy("");
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) return toast("Konfirmasi password tidak sama", "error");
    if (!(await confirm({ title: "Ubah password?", message: "Gunakan password baru saat login berikutnya.", confirmText: "Ubah" }))) return;
    setBusy("password");
    try {
      await api.patch("/profile/password", { oldPassword: passwords.oldPassword, newPassword: passwords.newPassword });
      setPasswords({ oldPassword: "", newPassword: "", confirm: "" });
      toast("Password berhasil diubah");
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 lg:mx-0">
      <PageTitle title="Pengaturan Akun" />

      <form onSubmit={saveProfile} className="card space-y-5 p-6">
        <h2 className="font-bold">Profil</h2>
        <div className="flex items-center gap-4">
          {preview ? <img src={preview} alt="" className="h-20 w-20 rounded-full object-cover" /> : <Avatar name={user.name} fileId={user.avatarId} size={80} />}
          <label className="btn-outline cursor-pointer">
            <Camera size={16} /> Ganti foto
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pickAvatar} />
          </label>
        </div>
        <Field label="Nama">
          <input className="input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required minLength={2} />
        </Field>
        <Field label="Email">
          <input className="input bg-slate-50" value={user.email} disabled />
        </Field>
        <Field label="Bio" hint={user.role === "ORGANIZER" ? "Tampil di profil publik organizer" : "Opsional"}>
          <textarea className="input min-h-24" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} maxLength={500} />
        </Field>
        <button className="btn-primary" disabled={busy === "profile"}>
          Simpan
        </button>
      </form>

      <form onSubmit={savePassword} className="card mt-6 space-y-4 p-6">
        <h2 className="font-bold">Ganti Password</h2>
        <Field label="Password lama">
          <input type="password" className="input" value={passwords.oldPassword} onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password baru">
            <input type="password" className="input" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required minLength={8} />
          </Field>
          <Field label="Konfirmasi password">
            <input type="password" className="input" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required />
          </Field>
        </div>
        <button className="btn-primary" disabled={busy === "password"}>
          Ubah password
        </button>
      </form>
    </div>
  );
}
