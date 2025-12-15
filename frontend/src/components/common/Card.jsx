import React from 'react';

const Card = ({ children, className = '', noPadding = false }) => {
    return (
        <div className={`innap-card ${noPadding ? 'p-0' : ''} ${className}`}>
            {children}
        </div>
    );
};

export default Card;
