import Main from './components/Main';
import { UserContextProvider } from './components/useUserContext';
import { SocketProvider } from './contexts/SocketContext';
import NotificationToast from './components/NotificationToast';
import { useUserContext } from './components/useUserContext';

// Inner component that has access to UserContext
const AppContent = () => {
  const { user } = useUserContext();

  return (
    <SocketProvider user={user}>
      <Main />
      <NotificationToast />
    </SocketProvider>
  );
};

function App() {
  return (
    <>
      <UserContextProvider>
        <AppContent />
      </UserContextProvider>
    </>
  );
}

export default App;
