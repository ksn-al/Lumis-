import React, { useEffect, useState } from 'react';
import { apiRequest, apiUpload } from '../api';
import Post from '../components/Post';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ displayname: '', username: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [headerFile, setHeaderFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [headerPreview, setHeaderPreview] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');
  const [isMe, setIsMe] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Always fetch current user id for comments
        const meData = await apiRequest('/users/me').catch(() => null);
        if (meData?.user) setCurrentUserId(meData.user.id);

        if (!username) {
          if (meData && meData.user) {
            const u = meData.user;
            setProfile({
              ...u,
              followersCount: u.followersCount ?? u.followers?.length ?? 0,
              followingCount: u.followingCount ?? u.following?.length ?? 0,
            });
            setForm({ displayname: u.displayname || '', username: u.username || '' });
            setIsMe(true);
          }
        } else {
          const data = await apiRequest(`/users/${username}`);
          // Normalize counts so the display always has a reliable number to read
          const normalized = {
            ...data,
            followersCount: data.followersCount ?? data.followers?.length ?? 0,
            followingCount: data.followingCount ?? data.following?.length ?? 0,
          };
          setProfile(normalized);
          setIsMe(meData?.user?.id === data.id);
          if (meData?.user) {
            setIsFollowing(data.followers?.some(f => f.id === meData.user.id) || false);
          }
        }
      } catch {
        setProfile(null);
        setIsMe(false);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  const handleCancel = () => {
    setEditMode(false);
    setSaveMsg('');
    setAvatarFile(null);
    setHeaderFile(null);
    setAvatarPreview(null);
    setHeaderPreview(null);
    setForm({ displayname: profile.displayname || '', username: profile.username || '' });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'avatar') { setAvatarFile(file); setAvatarPreview(reader.result); }
      else { setHeaderFile(file); setHeaderPreview(reader.result); }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveMsg('');

    // Fix 5 — validate before send; empty required fields are rejected early
    if (!form.displayname || !form.displayname.trim()) {
      setSaveMsg('Display name cannot be empty');
      return;
    }
    if (!form.username || !form.username.trim()) {
      setSaveMsg('Username cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      // Fix 5 — always append text fields (they hold the current/updated value);
      // truthy check was dropping intentional changes to short-but-valid strings.
      formData.append('displayname', form.displayname.trim());
      formData.append('username',    form.username.trim());
      if (avatarFile)  formData.append('avatar',      avatarFile);
      if (headerFile)  formData.append('headerPhoto', headerFile);

      const data = await apiUpload('/users/me', formData);
      if (data.user) {
        // Fix 4 — data.user is the raw Prisma row (no followers/following/counts).
        // Merge only the scalar fields that updateProfile actually changes; explicitly
        // preserve all follow-related data from the existing state so counts don't
        // reset to 0 or go stale.
        setProfile(prev => ({
          ...prev,
          // Scalar fields updated on the server
          displayname:          data.user.displayname,
          username:             data.user.username,
          avatar:               data.user.avatar,
          headerPhoto:          data.user.headerPhoto,
          // Preserve follow state (unchanged by profile edit)
          followers:            prev.followers,
          following:            prev.following,
          followersCount:       prev.followersCount,
          followingCount:       prev.followingCount,
          // Preserve posts list
          posts:                prev.posts,
        }));
        setEditMode(false);
        setAvatarFile(null);
        setHeaderFile(null);
        setAvatarPreview(null);
        setHeaderPreview(null);
        setSaveMsg('Профіль оновлено!');
      } else {
        setSaveMsg(data.message || 'Помилка оновлення профілю');
      }
    } catch (err) {
      setSaveMsg(err.message || 'Помилка оновлення профілю');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      await apiRequest(`/users/${profile.username}/follow`, 'POST');
      setIsFollowing(true);
      setProfile(prev => ({ ...prev, followersCount: (prev.followersCount || 0) + 1 }));
    } catch {}
  };

  const handleUnfollow = async () => {
    try {
      await apiRequest(`/users/${profile.username}/unfollow`, 'POST');
      setIsFollowing(false);
      setProfile(prev => ({ ...prev, followersCount: Math.max(0, (prev.followersCount || 1) - 1) }));
    } catch {}
  };

  const handleMessage = () => {
    if (profile?.username) navigate(`/messages?to=${profile.username}`);
    else navigate('/messages');
  };

  if (loading) return (
    <div className="profile-loading-wrap">
      <div className="spinner" />
    </div>
  );
  if (!profile) return <p className="profile-loading">User not found</p>;

  const resolveUrl = (url) => !url ? null : url.startsWith('http') ? url : `${API_URL}${url}`;
  const avatarSrc = avatarPreview || resolveUrl(profile.avatar);
  const headerSrc = headerPreview || resolveUrl(profile.headerPhoto);

  return (
    <div className="profile-page-modern">
      {editMode && isMe ? (
        <form onSubmit={handleSave} className="profile-edit-form">
          <h3>Edit Profile</h3>

          <label>
            Header photo:
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              {headerSrc && (
                <img src={headerSrc} alt="header" style={{ width: 120, height: 40, objectFit: 'cover', borderRadius: 4 }} />
              )}
              <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'header')} />
            </div>
          </label>

          <label>
            Avatar:
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              {avatarSrc && (
                <img src={avatarSrc} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
              )}
              <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'avatar')} />
            </div>
          </label>

          <label>
            Display name:
            <input
              name="displayname"
              value={form.displayname}
              onChange={e => setForm({ ...form, displayname: e.target.value })}
            />
          </label>

          <label>
            Username:
            <input
              name="username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
            />
          </label>

          <button className="profile-save-button" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={handleCancel}>Cancel</button>
          {saveMsg && <div className="profile-save-msg">{saveMsg}</div>}
        </form>
      ) : (
        <div className="profile-modern-card">
          {headerSrc && (
            <div className="profile-modern-cover-wrap">
              <img src={headerSrc} alt="cover" className="profile-modern-cover" />
            </div>
          )}
          <div className="profile-modern-main-row">
            <div className="profile-modern-avatar-block">
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" className="profile-modern-avatar" />
              ) : (
                <div className="profile-modern-avatar profile-modern-avatar-placeholder">
                  {profile.displayname?.[0] || profile.username?.[0] || '?'}
                </div>
              )}
            </div>
            <div className="profile-modern-info-block">
              <div className="profile-modern-names">
                <span className="profile-modern-displayname">{profile.displayname}</span>
                <span className="profile-modern-username">@{profile.username}</span>
              </div>
              <div className="profile-modern-follow-row">
                <span className="profile-modern-following" onClick={() => setShowModal('following')}>
                  Following: {profile.followingCount ?? profile.following?.length ?? 0}
                </span>
                <span className="profile-modern-followers" onClick={() => setShowModal('followers')}>
                  Followers: {profile.followersCount ?? profile.followers?.length ?? 0}
                </span>
              </div>
              {!isMe && (
                <div className="profile-modern-actions">
                  {isFollowing ? (
                    <button className="profile-unfollow-button" onClick={handleUnfollow}>Unfollow</button>
                  ) : (
                    <button className="profile-follow-button" onClick={handleFollow}>Follow</button>
                  )}
                  <button className="profile-message-button" onClick={handleMessage}>Send Message</button>
                </div>
              )}
              {isMe && (
                <button className="profile-edit-btn-under-avatar" onClick={() => setEditMode(true)}>Edit</button>
              )}
            </div>
          </div>
          {saveMsg && <div className="profile-save-msg">{saveMsg}</div>}
        </div>
      )}

      <div className="profile-modern-posts-block">
        <h3 className="profile-modern-posts-title">Posts</h3>
        {profile.posts && profile.posts.length > 0 ? (
          profile.posts.map(post => (
            <Post
              key={post.id}
              currentUserId={currentUserId}
              onDelete={postId =>
                setProfile(prev => ({ ...prev, posts: prev.posts.filter(p => p.id !== postId) }))
              }
              post={{
                ...post,
                user: {
                  id: profile.id,
                  username: profile.username,
                  displayname: profile.displayname,
                  avatar: profile.avatar,
                },
              }}
            />
          ))
        ) : (
          <div className="profile-no-posts">No posts yet</div>
        )}
      </div>

      {showModal && (
        <div className="profile-modal-backdrop" onClick={() => setShowModal(null)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <h3 className="profile-modal-title">
              {showModal === 'following' ? 'Following' : 'Followers'}
            </h3>
            <ul className="profile-modal-list">
              {(showModal === 'following' ? profile.following : profile.followers)?.length > 0 ? (
                (showModal === 'following' ? profile.following : profile.followers).map(user => (
                  <li
                    className="profile-modal-list-item"
                    key={user.id}
                    onClick={() => { setShowModal(null); navigate(`/profile/${user.username}`); }}
                    style={{ cursor: 'pointer' }}
                  >
                    {resolveUrl(user.avatar) ? (
                      <img
                        src={resolveUrl(user.avatar)}
                        alt="avatar"
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', marginRight: 10, flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', background: '#333',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginRight: 10, flexShrink: 0, fontWeight: 'bold', fontSize: 14,
                      }}>
                        {(user.displayname || user.username)?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600 }}>{user.displayname || user.username}</div>
                      <div style={{ fontSize: 13, opacity: 0.6 }}>@{user.username}</div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="profile-modal-list-item">No data available</li>
              )}
            </ul>
            <button className="profile-modal-close" onClick={() => setShowModal(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
