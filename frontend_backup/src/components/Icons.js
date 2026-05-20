
export const LikeIcon = ({ filled = false, ...props }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 21s-6.7-4.35-9.33-8.28C.6 9.7 2.1 5.5 6.1 5.5c2.08 0 3.3 1.18 3.9 2.2.6-1.02 1.82-2.2 3.9-2.2 4 0 5.5 4.2 3.43 7.22C18.7 16.65 12 21 12 21z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// SVG-иконка избранного 
export const FavoriteIcon = ({ filled = false, ...props }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 3.8l2.5 5.07 5.6.82-4.05 3.95.96 5.58L12 16.98 6.99 19.22l.96-5.58L3.9 9.69l5.6-.82L12 3.8z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

// SVG-иконка пользователя (User)
export const UserIcon = (props) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" {...props}>
    <circle cx="11" cy="8" r="4" stroke="#6b8f71" strokeWidth="1.5" fill="none"/>
    <path d="M4 18c0-3 4-5 7-5s7 2 7 5" stroke="#6b8f71" strokeWidth="1.5" fill="none"/>
  </svg>
);
