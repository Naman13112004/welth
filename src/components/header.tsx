import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  UserButton 
} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, PenBox } from "lucide-react";
import { checkUser } from "@/lib/checkUser";

const Header = async () => {
  await checkUser();

  return (
    <div className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <Image 
            src={"/logo.png"}
            height={60}
            width={200}
            alt="welth logo"
            className="h-12 w-auto object-contain"
          />
        </Link>
      
        <div className="flex items-center space-x-4">
          <SignedIn>
            <Button asChild variant="outline"> 
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
                <LayoutDashboard size={18} />
                <span className="hidden md:inline">Dashboard</span>
              </Link>
            </Button>
            <Button asChild className="flex items-center gap-2">  
              <Link href="/transaction/create">
                <PenBox size={18} />
                <span className="hidden md:inline">Add Transaction</span>
              </Link>
            </Button>
          </SignedIn>

          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="outline">Login</Button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
          </SignedIn>
        </div>
      </nav>
    </div>
  );
};

export default Header;