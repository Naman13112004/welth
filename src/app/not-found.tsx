import { Button } from "@/components/ui/button";
import Link from "next/link";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100vh] text-center px-4">
        <h1 className="text-6xl font-bold gradient gradient-title mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
            Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Button asChild>
            <Link href="/">
                Return Home
            </Link>
        </Button>
    </div>
  );
};

export default NotFound;