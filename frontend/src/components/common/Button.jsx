import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    type = 'button',
    onClick,
    ...props
}) => {
    // Base styles
    const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    // Rounded styles (Innap usually uses 10px or full pill for some)
    const roundedStyles = "rounded-lg";

    // Size variants
    const sizeStyles = {
        xs: "px-2.5 py-1.5 text-xs",
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
        xl: "px-8 py-4 text-lg"
    };

    // Color/Variant styles
    const variantStyles = {
        primary: "bg-[var(--primary)] text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow",
        secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500 shadow-sm",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
        success: "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500 shadow-sm",
        warning: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 shadow-sm",

        // Soft / Light variants (Innap style)
        'soft-primary': "bg-blue-50 text-[var(--primary)] hover:bg-blue-100 focus:ring-blue-500 border border-transparent",
        'soft-danger': "bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500 border border-transparent",
        'soft-success': "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-500 border border-transparent",
        'soft-warning': "bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-500 border border-transparent",
        'soft-purple': "bg-purple-50 text-purple-700 hover:bg-purple-100 focus:ring-purple-500 border border-transparent",
        'soft-teal': "bg-teal-50 text-teal-700 hover:bg-teal-100 focus:ring-teal-500 border border-transparent",
        'soft-orange': "bg-orange-50 text-orange-700 hover:bg-orange-100 focus:ring-orange-500 border border-transparent",

        ghost: "bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100"
    };

    const classes = `
        ${baseStyles}
        ${roundedStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
    `;

    return (
        <button
            type={type}
            className={classes}
            disabled={disabled}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
