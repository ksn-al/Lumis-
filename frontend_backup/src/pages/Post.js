/*import React, { useState } from "react";
import { apiRequest } from "../api";

// Компонент для отображения одного поста
function Post({ post }) {
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const handleLike = async () => {
    await apiRequest(`/posts/${post.id}/like`, "POST");
    setLiked(!liked);
  };
  const handleFavorite = async () => {
    await apiRequest(`/posts/${post.id}/favorite`, "POST");
    setFavorited(!favorited);
  };
  return (
    <div className="post">
      <p className="post-user"><b>{post.user.displayname}</b></p>
      <div className="post-text">{post.text}</div>
      <div className="post-actions">
          <button className="post-like-button" onClick={handleLike}>Лайк</button>
          <button className="post-favorite-button" onClick={handleFavorite}>Вибране</button>
          <span className="post-date">{post.createdAt}</span>
     </div>
    </div>
  );
}

export default Post;*/
