import React from 'react'

interface TagProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
  children: React.ReactNode
  className?: string
}

export const Tag: React.FC<TagProps> = ({
  variant = 'default',
  children,
  className = ''
}) => {
  const variants = {
    success: 'bg-semantic-success text-white',
    warning: 'bg-semantic-warning text-neutral-black',
    error: 'bg-semantic-error text-white',
    info: 'bg-semantic-info text-white',
    default: 'bg-neutral-light-gray text-neutral-dark-gray'
  }
  
  return (
    <span 
      className={`
        inline-block 
        px-2 py-1 
        rounded-full 
        text-caption 
        font-medium
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}