import React, { useEffect, useState } from "react";
import { apiRequest } from "../api";
import Post from "../components/Post";
import { useParams, useNavigate } from "react-router-dom";



function Profile() {
  const { username } = useParams(); // username из URL
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ displayname: "", avatar: "", cover: "" });
  const [saveMsg, setSaveMsg] = useState("");
  const [isMe, setIsMe] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        if (!username) {
          const data = await apiRequest("/users/me");
          if (data && data.user) {
            setProfile(data.user);
            setForm({
              displayname: data.user.displayname || "",
              avatar: data.user.avatar || "",
              cover: data.user.cover || ""
            });
            setIsMe(true);
          }
        } else {
          const data = await apiRequest(`/users/${username}`);
          setProfile(data);
          setIsMe(false);
          try {
            const me = await apiRequest("/users/me");
            if (me && me.user) {
              setIsFollowing(data.followers?.some(f => f.id === me.user.id));
            } else {
              setIsFollowing(false);
            }
          } catch {
            setIsFollowing(false);
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

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setSaveMsg("");
    setForm({
      displayname: profile.displayname || "",
      avatar: profile.avatar || "",
      cover: profile.cover || ""
    });
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaveMsg("");
    setLoading(true);
    try {
      const data = await apiRequest("/users/me", "PUT", form);
      if (data.user) {
        setProfile(data.user);
        setEditMode(false);
        setSaveMsg("Профіль оновлено!");
      } else {
        setSaveMsg(data.message || "Помилка оновлення профілю");
      }
    } catch (err) {
      setSaveMsg(err.message || "Помилка оновлення профілю");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      await apiRequest(`/users/${profile.username}/follow`, "POST");
      setIsFollowing(true);
    } catch {}
  };
  const handleUnfollow = async () => {
    try {
      await apiRequest(`/users/${profile.username}/unfollow`, "POST");
      setIsFollowing(false);
    } catch {}
  };
  const handleMessage = () => {
    // Переход к сообщениям с этим пользователем
    if (profile && profile.username) {
      navigate(`/messages?to=${profile.username}`);
    } else {
      navigate("/messages");
    }
  };

  if (loading) return <div>Завантаження...</div>;

  return (
    <div className="profile-page-modern">
      {profile ? (
        <>
          {editMode && isMe ? (
            <form onSubmit={handleSave} className="profile-edit-form">
              <label>
                Displayname:
                <input name="displayname" value={form.displayname} onChange={handleChange} />
              </label>
              <label>
                Avatar URL:
                <input name="avatar" value={form.avatar} onChange={handleChange} />
              </label>
              <label>
                Cover URL:
                <input name="cover" value={form.cover} onChange={handleChange} />
              </label>
              <button className="profile-save-button" type="submit">Зберегти</button>
              <button type="button" onClick={handleCancel}>Скасувати</button>
              {saveMsg && <div className="profile-save-msg">{saveMsg}</div>}
            </form>
          ) : (
            <div className="profile-modern-card">
              {profile.cover && (
                <div className="profile-modern-cover-wrap">
                  <img src={profile.cover} alt="cover" className="profile-modern-cover" />
                </div>
              )}
              <div className="profile-modern-main-row">
                <div className="profile-modern-avatar-block">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="avatar" className="profile-modern-avatar" />
                  ) : (
                    <div className="profile-modern-avatar profile-modern-avatar-placeholder">
                      {profile.displayname?.[0] || profile.username?.[0] || "?"}
                    </div>
                  )}
                </div>
                <div className="profile-modern-info-block">
                  <div className="profile-modern-names">
                    <span className="profile-modern-displayname">{profile.displayname}</span>
                    <span className="profile-modern-username">@{profile.username}</span>
                  </div>
                  <div className="profile-modern-follow-row">
                    <span className="profile-modern-following" onClick={() => setShowModal("following")}>Підписки: {profile.following ? profile.following.length : 0}</span>
                    <span className="profile-modern-followers" onClick={() => setShowModal("followers")}>Підписники: {profile.followers ? profile.followers.length : 0}</span>
                  </div>
                  {!isMe && (
                    <div className="profile-modern-actions">
                      {isFollowing ? (
                        <button className="profile-unfollow-button" onClick={handleUnfollow}>Відписатися</button>
                      ) : (
                        <button className="profile-follow-button" onClick={handleFollow}>Підписатися</button>
                      )}
                      <button className="profile-message-button" onClick={handleMessage}>Написати повідомлення</button>
                    </div>
                  )}
                  {isMe && !editMode && (
                    <button className="profile-edit-btn-under-avatar" onClick={handleEdit}>Редагувати</button>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Лента постов пользователя */}
          <div className="profile-modern-posts-block">
            <h3 className="profile-modern-posts-title">Пости користувача</h3>
            {profile.posts && profile.posts.length > 0 ? (
              profile.posts.map(post => (
                <Post key={post.id} post={{
                  ...post,
                  user: {
                    id: profile.id,
                    username: profile.username,
                    displayname: profile.displayname,
                    avatar: profile.avatar
                  }
                }} />
              ))
            ) : (
              <div className="profile-no-posts">Постів ще немає</div>
            )}
          </div>
          {/* Модальне вікно для списків */}
          {showModal && (
            <div className="profile-modal-backdrop">
              <div className="profile-modal">
                <h3 className="profile-modal-title">{showModal === "following" ? "Підписки" : "Підписники"}</h3>
                <ul className="profile-modal-list">
                  {(showModal === "following" ? profile.following : profile.followers)?.length > 0 ? (
                    (showModal === "following" ? profile.following : profile.followers).map(user => (
                      <li className="profile-modal-list-item" key={user.id}>{user.displayname} (@{user.username})</li>
                    ))
                  ) : (
                    <li className="profile-modal-list-item">Данні відсутні</li>
                  )}
                </ul>
                <button className="profile-modal-close" onClick={() => setShowModal(null)}>Закрити</button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="profile-loading">Завантаження...</p>
      )}
    </div>
  );
}

export default Profile;
