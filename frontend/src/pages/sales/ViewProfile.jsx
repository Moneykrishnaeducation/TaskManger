import React, { useState } from "react";


export default function SalesProfile() {
  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [editMode, setEditMode] = useState(false);
  const [phone, setPhone] = useState(user.phone || '');
  const [joined, setJoined] = useState(user.date_joined ? user.date_joined.split('T')[0] : '');
  const [dob, setDob] = useState(user.dob || '');

  const profile = {
    name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username || 'User',
    email: user.email || 'N/A',
    role: user.user_type ? user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1) : 'Staff',
    department: user.department || 'N/A',
    phone,
    joined,
    dob,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name ? user.first_name + ' ' + user.last_name : user.username || 'User')}&background=0D8ABC&color=fff&size=128`,
  };

  const handleSave = () => {
    // Save changes to localStorage (simulate API update)
    const updatedUser = { ...user, phone, date_joined: joined, dob };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setEditMode(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md flex flex-col items-center">
        <img
          src={profile.avatar}
          alt={profile.name}
          className="w-32 h-32 rounded-full mb-4 border-4 border-blue-200 shadow"
        />
        <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
        <p className="text-gray-500 mb-4">{profile.role} {user.department ? <>&mdash; {profile.department}</> : null}</p>
        <div className="w-full space-y-2">
          <div className="flex justify-between text-gray-700">
            <span className="font-medium">Email:</span>
            <span>{profile.email}</span>
          </div>
          <div className="flex justify-between text-gray-700 items-center">
            <span className="font-medium">Phone:</span>
            {editMode ? (
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="border rounded px-2 py-1 w-40"
              />
            ) : (
              <span>{profile.phone || 'N/A'}</span>
            )}
          </div>
          <div className="flex justify-between text-gray-700 items-center">
            <span className="font-medium">Joined:</span>
            {editMode ? (
              <input
                type="date"
                value={joined}
                onChange={e => setJoined(e.target.value)}
                className="border rounded px-2 py-1 w-40"
              />
            ) : (
              <span>{profile.joined || 'N/A'}</span>
            )}
          </div>
          <div className="flex justify-between text-gray-700 items-center">
            <span className="font-medium">DOB:</span>
            {editMode ? (
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                className="border rounded px-2 py-1 w-40"
              />
            ) : (
              <span>{profile.dob || 'N/A'}</span>
            )}
          </div>
        </div>
        <div className="mt-6 flex gap-4">
          {editMode ? (
            <>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Save
              </button>
              <button
                onClick={() => { setEditMode(false); setPhone(user.phone || ''); setJoined(user.date_joined ? user.date_joined.split('T')[0] : ''); setDob(user.dob || ''); }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
