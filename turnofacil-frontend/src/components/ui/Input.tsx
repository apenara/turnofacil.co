import React, { useId } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const generatedId = useId()
  const inputId = id || generatedId
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-caption text-neutral-dark-gray mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-sm py-sm rounded-md border
          ${error 
            ? 'border-semantic-error focus:border-semantic-error focus:ring-semantic-error' 
            : 'border-neutral-light-gray focus:border-primary focus:ring-primary'
          }
          bg-white text-neutral-black
          focus:outline-none focus:ring-2 focus:ring-opacity-20
          disabled:bg-neutral-off-white disabled:text-neutral-medium-gray disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {(error || helperText) && (
        <p className={`mt-1 text-caption ${error ? 'text-semantic-error' : 'text-neutral-medium-gray'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  )
}