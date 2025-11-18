import PropTypes from 'prop-types';

/**
 * Radio Component
 * A single radio button input with label and description
 */
function RadioButton({
  label,
  description,
  value,
  checked,
  onChange,
  disabled = false,
  error,
  name,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="radio"
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className={`
              w-4 h-4 border-gray-300 text-blue-600
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
    </div>
  );
}

RadioButton.propTypes = {
  label: PropTypes.string,
  description: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
};

/**
 * RadioGroup Component
 * A group of radio buttons with label and error support
 */
export default function RadioGroup({
  label,
  options = [],
  value,
  onChange,
  name,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="space-y-3">
        {options.map((option) => (
          <RadioButton
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            description={option.description}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            disabled={disabled || option.disabled}
            error={error}
          />
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-2 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
}

RadioGroup.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      disabled: PropTypes.bool,
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

// Also export RadioButton for standalone use
export { RadioButton };
