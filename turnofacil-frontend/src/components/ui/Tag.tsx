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
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-black',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    default: 'bg-gray-200 text-gray-700'
  }
  
  return (
    <span 
      className={`
        inline-block 
        px-2 py-1 
        rounded-full 
        text-sm 
        font-medium
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}