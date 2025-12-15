import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PencilIcon, DuplicateIcon, TrashIcon, ExclamationIcon, DotsHorizontalIcon } from '@heroicons/react/outline';

const ShiftCard = ({
    shift,
    onEdit,
    onRemove,
    onDuplicate,
    hasConflict = false,
    conflictMessage = ''
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: shift.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : (isMenuOpen ? 40 : 'auto'),
        position: 'relative', 
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getShiftStyles = (type) => {
        const styles = {
            morning: {
                bg: 'bg-emerald-50',
                border: 'border-l-emerald-500',
                hover: 'hover:bg-emerald-100',
                avatar: 'bg-emerald-200 text-emerald-800',
                text: 'text-emerald-900'
            },
            mid: {
                bg: 'bg-sky-50',
                border: 'border-l-sky-500',
                hover: 'hover:bg-sky-100',
                avatar: 'bg-sky-200 text-sky-800',
                text: 'text-sky-900'
            },
            evening: {
                bg: 'bg-violet-50',
                border: 'border-l-violet-500',
                hover: 'hover:bg-violet-100',
                avatar: 'bg-violet-200 text-violet-800',
                text: 'text-violet-900'
            },
            custom: {
                bg: 'bg-orange-50',
                border: 'border-l-orange-500',
                hover: 'hover:bg-orange-100',
                avatar: 'bg-orange-200 text-orange-800',
                text: 'text-orange-900'
            }
        };
        return styles[type] || styles.morning;
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const styles = getShiftStyles(shift.shiftType);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`mb-2 rounded-md border-l-[3px] shadow-sm transition-all duration-200 group ${styles.bg} ${styles.border} ${styles.hover} ${
                hasConflict ? 'ring-2 ring-red-500 ring-offset-1' : 'hover:shadow-md'
            }`}
            onDoubleClick={() => onEdit(shift)}
            title={`${shift.employeeName || shift.username} | ${shift.startTime} - ${shift.endTime}${shift.clientName ? ` | ${shift.clientName}` : ''}`}
        >
            {/* Draggable Handle & Content */}
            <div 
                {...attributes} 
                {...listeners}
                className="px-2 py-2 cursor-grab active:cursor-grabbing relative flex items-center justify-between gap-2"
            >
                {/* Left: Avatar */}
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm ${styles.avatar}`}>
                    {getInitials(shift.employeeName || shift.username)}
                </div>

                {/* Middle: Time Range */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className={`text-[10px] font-bold ${styles.text} leading-tight text-center`}>
                        {shift.startTime}
                    </span>
                    <div className="h-px bg-black/5 w-full my-0.5"></div>
                    <span className={`text-[10px] font-bold ${styles.text} leading-tight text-center`}>
                        {shift.endTime}
                    </span>
                </div>

                {/* Right: Menu Trigger */}
                <div className="flex-shrink-0 w-4 flex justify-end" onPointerDown={(e) => e.stopPropagation()}>
                     {/* Meatball Menu Button - Visible on Hover */}
                     <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(!isMenuOpen);
                            }}
                            className="p-0.5 rounded hover:bg-black/10 text-gray-500 transition-colors"
                        >
                            <DotsHorizontalIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div 
                                ref={menuRef}
                                className="absolute right-0 top-6 w-40 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 flex flex-col animate-in fade-in zoom-in duration-100 origin-top-right text-left"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="px-3 py-2 border-b border-gray-50 bg-gray-50/50">
                                    <span className="text-xs font-bold text-gray-900 block">
                                        {shift.employeeName || shift.username}
                                    </span>
                                    {shift.clientName && (
                                        <span className="text-[10px] text-gray-500 block truncate mt-0.5">
                                            Client: {shift.clientName}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => { setIsMenuOpen(false); onEdit(shift); }}
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                                >
                                    <PencilIcon className="w-3.5 h-3.5" /> Edit Details
                                </button>
                                <button
                                    onClick={() => { setIsMenuOpen(false); onDuplicate(shift); }}
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2"
                                >
                                    <DuplicateIcon className="w-3.5 h-3.5" /> Duplicate
                                </button>
                                <button
                                    onClick={() => { setIsMenuOpen(false); onRemove(shift.id); }}
                                    className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <TrashIcon className="w-3.5 h-3.5" /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftCard;