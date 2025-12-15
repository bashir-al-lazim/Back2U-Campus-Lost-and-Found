import { Link } from "react-router-dom";

const ErrorPage = () => {
    return (
        <div className='flex flex-col justify-center items-center w-full min-h-screen bg-white'>
            <img className="rounded-3xl" src="https://i.ibb.co.com/zG0Bh37/404.gif" alt="404 error gif" />
            <Link to={'/'} className="relative inline-flex items-center justify-center p-4 px-6 py-3 overflow-hidden font-medium text-indigo-600 transition duration-300 ease-out border-2 border-yellow-400 rounded-xl shadow-md group mt-4">
                <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-yellow-400 group-hover:translate-x-0 ease">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </span>
                <span className="absolute flex items-center justify-center w-full h-full text-yellow-500 transition-all duration-300 transform group-hover:translate-x-full ease">Go to Home</span>
                <span className="relative invisible">Button Text</span>
            </Link>
        </div>
    );
};

export default ErrorPage;