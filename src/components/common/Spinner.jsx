import PropTypes from 'prop-types';

/**
 * Spinner Component
 * A loading indicator
 */
export default function Spinner({
  size = 'md',
  color = 'blue',
  centered = false,
  text,
  className = '',
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colors = {
    blue: 'border-blue-600',
    gray: 'border-gray-600',
    green: 'border-green-600',
    red: 'border-red-600',
    white: 'border-white',
  };

  const spinner = (
    <div
      className={`
        ${sizes[size]}
        border-4
        ${colors[color]}
        border-t-transparent
        rounded-full
        animate-spin
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );

  if (centered) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3">
        {spinner}
        {text && <p className="text-gray-600 text-sm">{text}</p>}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-2">
      {spinner}
      {text && <span className="text-gray-600 text-sm">{text}</span>}
    </div>
  );
}

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  color: PropTypes.oneOf(['blue', 'gray', 'green', 'red', 'white']),
  centered: PropTypes.bool,
  text: PropTypes.string,
  className: PropTypes.string,
};
