import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../api/client';
import Sidebar from '../components/Sidebar';
import { User, Mail, Globe, FileText, Upload, CheckCircle, XCircle, Loader2, LogOut } from 'lucide-react';

export default function Profile() {
  const { user, loadProfile, logout } = useAuth();
  const [profile, setProfile] = useState({ first_name: '', last_name: '', username: '', timezone: 'UTC', bio: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const checkTimer = useRef(null);

  useEffect(() => {
    if (user) {
      setProfile({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        timezone: user.timezone || 'UTC',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
    if (name === 'username') {
      const newUsername = value.trim();
      if (!newUsername || newUsername === user?.username) {
        setUsernameAvailable(null);
        return;
      }
      if (checkTimer.current) clearTimeout(checkTimer.current);
      checkTimer.current = setTimeout(async () => {
        setCheckingUsername(true);
        try {
          const res = await auth.checkUsername(newUsername);
          setUsernameAvailable(res.data.available);
        } catch {
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      }, 400);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (usernameAvailable === false) return;
    setSaving(true);
    setMessage('');
    try {
      await auth.updateProfile(profile);
      await loadProfile();
      setMessage('Profile updated!');
      setEditing(false);
    } catch (err) {
      const detail = err.response?.data?.username?.[0] || 'Failed to update profile';
      setMessage(detail);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    try {
      await auth.uploadAvatar(formData);
      await loadProfile();
      setMessage('Avatar updated!');
    } catch {
      setMessage('Failed to upload avatar');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120]">
      <Sidebar />
      <main className="ml-64 p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your public profile and booking link.</p>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-primary">Edit profile</button>
          )}
        </div>

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-xl mb-6 text-sm border ${
            message.includes('Failed') || message.includes('taken')
              ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400'
              : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-400'
          }`}>
            {message.includes('Failed') || message.includes('taken') ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {message}
          </div>
        )}

        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover ring-4 ring-slate-50 dark:ring-slate-700" />
            ) : (
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 text-2xl font-bold">
                {user?.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{user?.username}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                caly.app/book/{user?.username}
              </p>
            </div>
          </div>

          {editing && (
            <form onSubmit={saveProfile} className="space-y-5 border-t border-slate-100 dark:border-slate-700 pt-6">
              <div className="flex items-center gap-4">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300 text-lg font-bold">
                    {user?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Upload Avatar</label>
                  <div className="flex items-center gap-2">
                    <label className="btn-secondary text-xs cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      Choose file
                      <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} className="hidden" />
                    </label>
                    {avatarFile && (
                      <button type="button" onClick={handleAvatarUpload} className="btn-primary text-xs">
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">First name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input name="first_name" value={profile.first_name} onChange={handleProfileChange} className="input-field pl-10" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Last name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input name="last_name" value={profile.last_name} onChange={handleProfileChange} className="input-field pl-10" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
                <div className="relative">
                  <input
                    name="username"
                    value={profile.username}
                    onChange={handleProfileChange}
                    className={`input-field pr-24 ${
                      usernameAvailable === true ? 'border-green-300 dark:border-green-600' : usernameAvailable === false ? 'border-red-300 dark:border-red-600' : ''
                    }`}
                  />
                  {checkingUsername && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                      <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                    </span>
                  )}
                  {usernameAvailable === true && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="w-3 h-3" /> Available
                    </span>
                  )}
                  {usernameAvailable === false && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                      <XCircle className="w-3 h-3" /> Taken
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Timezone</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="timezone" value={profile.timezone} onChange={handleProfileChange} className="input-field pl-10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Bio</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea name="bio" value={profile.bio} onChange={handleProfileChange} rows={3} className="input-field pl-10 resize-none" placeholder="Tell invitees about yourself..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving || usernameAvailable === false} className="btn-primary">
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save profile'}
                </button>
                <button type="button" onClick={() => { setEditing(false); setUsernameAvailable(null); }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {!editing && (
            <div className="border-t border-slate-100 dark:border-slate-700 pt-5 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Name:</span>
                <span className="text-slate-900 dark:text-white font-medium">{profile.first_name || '—'} {profile.last_name || ''}</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Timezone:</span>
                <span className="text-slate-900 dark:text-white font-medium">{profile.timezone}</span>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500 dark:text-slate-400">Bio:</span>
                <span className="text-slate-900 dark:text-white">{profile.bio || '—'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={logout} className="btn-danger">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </main>
    </div>
  );
}
