import React, { useEffect, useState } from "react";
import { apiRequest } from "../api";
import Post from "../components/Post";

function Feed() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [postError, setPostError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest("/posts/feed")
      .then((data) => setPosts(data.posts || []))
      .catch(() => setPosts([]));
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (newPost.length === 0 || newPost.length > 280) {
      setPostError("Текст поста повинен бути від 1 до 280 символів");
      return;
    }
    if (imageFile && imageFile.size > 2 * 1024 * 1024) { // 2MB
      setPostError("Картинка не повинна перевищувати 2MB");
      return;
    }
    setPostError("");
    setLoading(true);
    try {
      let formData = new FormData();
      formData.append("text", newPost);
      if (imageFile) {
        formData.append("image", imageFile);
      }
      const res = await fetch("/posts", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      const data = await res.json();
      if (data.post) {
        setPosts([data.post, ...posts]);
        setNewPost("");
        setImageFile(null);
        setImagePreview(null);
      } else {
        setPostError(data.message || "Помилка створення поста");
      }
    } catch (error) {
      setPostError(error.message || "Помилка створення поста");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setPostError("Картинка не повинна перевищувати 2MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="feed-card">
      <h2 className="feed-title">Лента</h2>
      <form onSubmit={handleCreatePost} className="feed-create-form">
        <textarea
          className="feed-textarea"
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
          maxLength={280}
          placeholder="Що нового?"
          required
        />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            className="feed-image-btn"
            title="Додати картинку"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22 }}
            onClick={() => document.getElementById("feed-image-input").click()}
          >
            📎
          </button>
          <input
            id="feed-image-input"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageChange}
          />
          {imagePreview && (
            <div style={{ position: "relative", display: "inline-block" }}>
              <img src={imagePreview} alt="preview" style={{ maxWidth: 60, maxHeight: 60, borderRadius: 8, border: "1px solid #eee" }} />
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{ position: "absolute", top: -8, right: -8, background: "#fff", border: "1px solid #ccc", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}
                title="Видалити картинку"
              >
                ×
              </button>
            </div>
          )}
          <button className="feed-create-btn" type="submit" disabled={loading}>{loading ? "Завантаження..." : "Створити пост"}</button>
        </div>
        {postError && <div className="feed-post-error">{postError}</div>}
      </form>
     <div className="feed-posts">
  {posts.length > 0 ? (
    posts.map(post => (
      <Post key={post.id} post={post} />
    ))
  ) : (
    <div className="feed-empty">Постів ще немає</div>
  )}
</div>
    </div>
  );
}

export default Feed;
