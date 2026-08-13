import React from 'react';

const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="input-label">
          {label}
          {required && <span className="text-status-unpaid ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`input ${error ? 'border-status-unpaid focus:ring-status-unpaid' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-status-unpaid">{error}</p>}
    </div>
  );
};

export default Input;