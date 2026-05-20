import React, { useState } from "react";
import { apiRequest } from "../api";
import { LikeIcon, FavoriteIcon } from "./Icons";

// Универсальный компонент для отображения одного поста

function Post({ post, onLike, onFavorite }) {
  const [liked, setLiked] = useState(post.liked || false);
  const [favorited, setFavorited] = useState(post.favorited || false);
  const [likeCount, setLikeCount] = useState(post.likesCount || 0);
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);
  const [error, setError] = useState("");

  const handleLike = async () => {
    setLoadingLike(true);
    setError("");
    try {
      await apiRequest(`/posts/${post.id}/like`, "POST");
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
      if (onLike) onLike(post.id, !liked);
    } catch (e) {
      setError(e.message || "Помилка лайка");
    } finally {
      setLoadingLike(false);
    }
  };

  const handleFavorite = async () => {
    setLoadingFav(true);
    setError("");
    try {
      await apiRequest(`/posts/${post.id}/favorite`, "POST");
      setFavorited(!favorited);
      if (onFavorite) onFavorite(post.id, !favorited);
    } catch (e) {
      setError(e.message || "Помилка вибраного");
    } finally {
      setLoadingFav(false);
    }
  };

  return (
    <div className="post">
      <div className="post-header">
        {post.user?.avatar && <img src={post.user.avatar} alt="avatar" className="post-avatar" />}
        <b>{post.user?.displayname || post.user?.username}</b>
      </div>
      <div className="post-text">{post.text}</div>
      {post.image && <img src={post.image} alt="post" className="post-image" />}
      <div className="post-actions">
        <button className={"post-like-button" + (liked ? " liked" : "")}
          onClick={handleLike} title="Лайк" disabled={loadingLike}>
          <LikeIcon style={{width: 22, height: 22, verticalAlign: "middle"}} filled={liked} />
          <span className="post-like-count">{likeCount}</span>
        </button>
        <button className={"post-favorite-button" + (favorited ? " favorited" : "")}
          onClick={handleFavorite} title="Вибране" disabled={loadingFav}>
          <FavoriteIcon style={{width: 22, height: 22, verticalAlign: "middle"}} filled={favorited} />
        </button>
        <span className="post-date">{new Date(post.createdAt).toLocaleString()}</span>
      </div>
      {error && <div className="post-error">{error}</div>}
    </div>
  );
}

export default Post;
