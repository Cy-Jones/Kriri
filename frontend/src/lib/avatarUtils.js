export const getInitial = (name, email) => {
  if (name) return name.substring(0, 2).toUpperCase();
  if (email) return email.substring(0, 2).toUpperCase();
  return 'U';
};

export const getAvatarColor = (name, email) => {
  const str = name || email || 'U';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'bg-[#E91E63]', 'bg-[#9C27B0]', 'bg-[#673AB7]', 'bg-[#3F51B5]',
    'bg-[#009688]', 'bg-[#4CAF50]', 'bg-[#FF9800]', 'bg-[#795548]',
    'bg-[#607D8B]', 'bg-[#F44336]', 'bg-[#f26d78]'
  ];
  return colors[Math.abs(hash) % colors.length];
};
