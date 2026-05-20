import React, { useEffect, useState } from "react";
import Post from "../components/Post";
import { apiRequest } from "../api";

function Favorite() {
        const [posts, setPosts] = useState([]);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState("");

        useEffect(() => {
            const fetchFavorites = async () => {
                setLoading(true);
                setError("");
                try {
                    const data = await apiRequest("/posts/favorites");
                    if (data.posts) setPosts(data.posts);
                    else setPosts([]);
                } catch (e) {
                    setPosts([]);
                    setError(e.message || "Помилка завантаження вибраного");
                } finally {
                    setLoading(false);
                }
            };
            fetchFavorites();
        }, []);

        return (
                <div className="favorite">
                        <h2 className="favorite-title">Вибране</h2>
                        {error && <div className="favorite-error">{error}</div>}
                        {loading && <div className="favorite-loading">Завантаження...</div>}
                        {posts.length > 0 && !loading ? (
                                posts.map(post => (
                                        <Post key={post.id} post={post} />
                                ))
                        ) : (!loading && !error &&
                                <p className="favorite-empty">У вас немає вибраних постів</p>
                        )}
                </div>
        )
}

export default Favorite;