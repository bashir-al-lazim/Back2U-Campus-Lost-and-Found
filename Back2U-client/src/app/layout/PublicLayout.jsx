import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Nav from '../../components/shared/Nav';
import Footer from '../../components/shared/Footer';

const PublicLayout = () => {
    return (
        <div className="border-x border-white relative">
            <Nav />
            <Outlet />
            <Footer />
            <ToastContainer
                position="bottom-right"
                autoClose={5000}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </div>
    );
};

export default PublicLayout;