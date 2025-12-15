import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const UserComponent = ({ id, name, onRemove }) => {
  const { setNodeRef, attributes, listeners, transition, transform, isDragging } = useSortable({
    id: id,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className="flex items-center text-xl font-medium mb-0.5 border-r-4 border-gray-400 select-none p-0.5 pr-1"
      style={style}
    >
      <span {...listeners} className="cursor-grab flex-1 pr-2">
        {name}
      </span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(id);
          }}
          className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded px-1 text-sm"
          title="Remove from schedule"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default UserComponent;
