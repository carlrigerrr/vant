import React, { forwardRef } from 'react';

const Input = forwardRef(({
    type = 'text',
    label,
    error,
    helperText,
    className = '',
    containerClassName = '',
    id,
    ...props
}, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

    return (
        <div className={`w-full ${containerClassName}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-[var(--text-heading)] mb-1.5"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {type === 'textarea' ? (
                    <textarea
                        ref={ref}
                        id={inputId}
                        className={`
                            block w-full px-4 py-3 
                            text-[var(--text-body)] 
                            bg-[#F5F8FA] border border-transparent 
                            rounded-[10px] 
                            focus:bg-white focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100 focus:outline-none 
                            transition-all duration-200
                            disabled:opacity-60 disabled:cursor-not-allowed
                            placeholder-gray-400
                            resize-y
                            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''}
                            ${className}
                        `}
                        {...props}
                    />
                ) : (
                    <input
                        ref={ref}
                        type={type}
                        id={inputId}
                        className={`
                            block w-full px-4 py-3 
                            text-[var(--text-body)] 
                            bg-[#F5F8FA] border border-transparent 
                            rounded-[10px] 
                            focus:bg-white focus:border-[var(--primary)] focus:ring-2 focus:ring-blue-100 focus:outline-none 
                            transition-all duration-200
                            disabled:opacity-60 disabled:cursor-not-allowed
                            placeholder-gray-400
                            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-100' : ''}
                            ${className}
                        `}
                        {...props}
                    />
                )}
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
