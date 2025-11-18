import PropTypes from 'prop-types';

/**
 * Checkbox Component
 * A customizable checkbox input with label and description support
 */
export default function Checkbox({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className={`
              w-4 h-4 rounded border-gray-300 text-blue-600
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
              transition-colors duration-200
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${error ? 'border-red-500' : ''}
            `}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="ml-3 text-sm">
            {label && (
              <label
                className={`font-medium ${
                  error ? 'text-red-700' : 'text-gray-900'
                } ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={`${error ? 'text-red-600' : 'text-gray-500'} ${disabled ? 'opacity-50' : ''}`}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600 ml-7">{error}</p>}
    </div>
  );
}

Checkbox.propTypes = {
  label: PropTypes.string,
  description: PropTypes.string,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
};
