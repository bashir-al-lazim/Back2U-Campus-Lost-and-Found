import GoogleButton from "../components/GoogleButton";


const SignInUp = () => {
    
    return (
        <div className="min-h-[calc(100vh-16.325rem)] m-auto px-12 sm:px-0 mx-auto pt-26">
            <div className="mx-auto h-full sm:w-max">
                <div className="m-auto py-12">
                    <div className="rounded-2xl border -mx-6 sm:-mx-10 p-8 sm:p-10">
                        <h3 className="text-2xl font-semibold text-gray-700 text-center">Click the Button to Hop In 🙂</h3>
                        <div className="mt-12 flex flex-wrap sm:grid gap-6 ">
                            <GoogleButton />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignInUp;