import React from 'react';

const Badge = ({
    children,
    variant = 'primary',
    size = 'md',
    rounded = 'md', // 'full' or 'md'
    className = '',
    ...props
}) => {
    // Base styles
    const baseStyles = "inline-flex items-center justify-center font-medium";

    // Rounded styles
    const roundedStyles = {
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full"
    };

    // Size styles
    const sizeStyles = {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm"
    };

    // Variant styles
    const variantStyles = {
        primary: "bg-blue-100 text-blue-800",
        secondary: "bg-gray-100 text-gray-800",
        success: "bg-green-100 text-green-800",
        danger: "bg-red-100 text-red-800",
        warning: "bg-yellow-100 text-yellow-800",
        info: "bg-indigo-100 text-indigo-800",
        purple: "bg-purple-100 text-purple-800",
        pink: "bg-pink-100 text-pink-800",
        orange: "bg-orange-100 text-orange-800",
        teal: "bg-teal-100 text-teal-800"
    };

    const classes = `
        ${baseStyles}
        ${roundedStyles[rounded]}
        ${sizeStyles[size]}
        ${variantStyles[variant] || variantStyles.primary}
        ${className}
    `;

    return (
        <span className={classes} {...props}>
            {children}
        </span>
    );
};

export default Badge;
