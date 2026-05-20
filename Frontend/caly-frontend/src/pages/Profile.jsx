import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../api/client';
import Sidebar from '../components/Sidebar';

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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 p-8 max-w-3xl min-h-screen">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${message.includes('Failed') || message.includes('taken') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-2xl">
                  {user?.username?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{user?.username}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)} className="bg-[#3B82F6] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition text-sm">
                Edit profile
              </button>
            )}
          </div>

          {editing && (
            <form onSubmit={saveProfile} className="space-y-4 border-t border-gray-100 pt-6">
              <div className="flex items-center gap-4 mb-4">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xl">
                    {user?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Avatar</label>
                  <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} className="text-sm" />
                  {avatarFile && (
                    <button type="button" onClick={handleAvatarUpload} className="bg-[#3B82F6] text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition mt-1">Upload</button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                  <input name="first_name" value={profile.first_name} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                  <input name="last_name" value={profile.last_name} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <input
                    name="username"
                    value={profile.username}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none ${
                      usernameAvailable === true ? 'border-green-500' : usernameAvailable === false ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {checkingUsername && <span className="absolute right-3 top-2.5 text-xs text-gray-400">Checking…</span>}
                  {usernameAvailable === true && <span className="absolute right-3 top-2.5 text-xs text-green-600">Available</span>}
                  {usernameAvailable === false && <span className="absolute right-3 top-2.5 text-xs text-red-600">Taken</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <input name="timezone" value={profile.timezone} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea name="bio" value={profile.bio} onChange={handleProfileChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving || usernameAvailable === false} className="bg-[#3B82F6] text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save profile'}
                </button>
                <button type="button" onClick={() => { setEditing(false); setUsernameAvailable(null); }} className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {!editing && (
            <div className="border-t border-gray-100 pt-4 space-y-3 text-sm text-gray-600">
              <p><span className="font-medium text-gray-700">First name:</span> {profile.first_name || '—'}</p>
              <p><span className="font-medium text-gray-700">Last name:</span> {profile.last_name || '—'}</p>
              <p><span className="font-medium text-gray-700">Timezone:</span> {profile.timezone}</p>
              <p><span className="font-medium text-gray-700">Bio:</span> {profile.bio || '—'}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition">Sign out</button>
        </div>
      </div>
    </div>
  );
}