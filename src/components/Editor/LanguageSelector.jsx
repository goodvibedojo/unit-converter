export default function LanguageSelector({ language, onChange, disabled = false }) {
  const languages = [
    { value: 'python', label: 'Python', icon: '🐍' },
    { value: 'javascript', label: 'JavaScript', icon: '📜' },
    { value: 'java', label: 'Java', icon: '☕' },
    { value: 'cpp', label: 'C++', icon: '⚡' }
  ];

  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700">Language:</label>
      <select
        value={language}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {languages.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.icon} {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
