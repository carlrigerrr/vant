import { useState } from 'react';
import { useUsersContext } from './../useUsersContext';
import UserInfoModal from './UserInfoModal';

const RequestListTableRow = ({ user, onClick }) => {
  const { refreshAllUsers } = useUsersContext();
  const [modalData, setModalData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [requestStatus, setReqStatus] = useState(null);

  const openModal = async () => {
    setModalData(user);
    setIsOpen(true);
  };

  const closeModal = async () => {
    setIsOpen(false);
    setModalData(null);
    setReqStatus(null);
    refreshAllUsers();
  };

  return (
    <>
      <tr className="hover:bg-slate-100">
        <td>
          <div className="flex items-center justify-between">
            <div className="pl-3">
              <div className="flex items-center text-lg leading-none">
                <p className="font-semibold text-gray-800">{user.username}</p>
                {user.admin && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Admin
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center">
                <span className="text-xs text-gray-500 mr-2">Jobs Completed:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {user.jobsCompleted || 0}
                </span>
              </div>
            </div>
            <UserInfoModal
              user={user}
              modalData={modalData}
              setModalData={setModalData}
              isOpen={isOpen}
              closeModal={closeModal}
              requestStatus={requestStatus}
              setReqStatus={setReqStatus}
            />
          </div>
        </td>
        <td className="w-1/12">
          <div>
            <button
              onClick={openModal}
              className="flex items-center justify-center px-2 py-3 mt-2 bg-gray-300 rounded-full"
            >
              <p className="text-base leading-3 text-gray-700">Edit</p>
            </button>
          </div>
        </td>
      </tr>
    </>
  );
};

export default RequestListTableRow;
