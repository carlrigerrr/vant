import { useState } from 'react';
import { parse, startOfDay, isAfter, isSameDay } from 'date-fns';

const RequestListTableRow = ({ name, comment, date, status, onClick }) => {
  // Try parsing with different formats
  let requestDate = parse(date, 'EEEE, dd MMMM yyyy', new Date());
  if (isNaN(requestDate.getTime())) {
    requestDate = parse(date, 'dd-MM-yyyy', new Date());
  }
  const currentDate = startOfDay(new Date());
  const isPastDate = !isNaN(requestDate.getTime()) && !isAfter(requestDate, currentDate) && !isSameDay(requestDate, currentDate);

  return (
    <>
      <tr>
        <td>
          <div className="items-center">
            <div className="pl-3">
              <div className="text-lg leading-none">
                <p className="font-semibold text-gray-800">{name}</p>
                {comment && (
                  <p className="font-semibold text-gray-800 whitespace-normal">{comment}</p>
                )}
                {!comment && (
                  <p className="italic font-medium text-gray-800 whitespace-normal">
                    No comment entered
                  </p>
                )}
                <p className="mt-0 mb-2 text-gray-600">{date}</p>
              </div>
            </div>
          </div>
        </td>
        <td className="w-1/12 lg:w-28">
          <div>
            {status && (
              <div
                onClick={onClick}
                className="flex items-center justify-center px-2 py-3 mt-2 bg-green-200 rounded-full hover:cursor-pointer"
              >
                <p className="text-base leading-3 text-green-700">Approved</p>
              </div>
            )}
            {isPastDate && !status && (
              <div
                onClick={onClick}
                className="flex items-center justify-center px-2 py-3 mt-2 bg-red-200 rounded-full"
              >
                <p className="text-base leading-3 text-red-700">Not Approved</p>
              </div>
            )}
            {!isPastDate && !status && (
              <div
                onClick={onClick}
                className="flex items-center justify-center px-2 py-3 mt-2 bg-yellow-200 rounded-full hover:cursor-pointer"
              >
                <p className="text-base leading-3 text-yellow-700">Pending</p>
              </div>
            )}
          </div>
        </td>
      </tr>
    </>
  );
};

export default RequestListTableRow;
