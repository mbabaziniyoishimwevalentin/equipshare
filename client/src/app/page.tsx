import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">EquipShare</span>
              <span className="text-2xl font-extrabold text-blue-600 tracking-tight">EquipShare</span>
            </a>
          </div>
          <div className="flex flex-1 justify-end space-x-4">
            <Link href="/login" className="text-sm font-semibold leading-6 text-gray-900 px-4 py-2 hover:bg-gray-50 rounded-md transition-colors">Log in</Link>
            <Link href="/register" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors">Sign up</Link>
          </div>
        </nav>
      </header>

      <div className="relative isolate pt-14 flex-1 flex items-center">
        <div className="w-full py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Rent anything, from anyone, in your neighborhood
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                EquipShare connects equipment owners with people who need them. Save money, reduce waste, and strengthen your local community.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link href="/login" className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-transform hover:scale-105">
                  Start Renting
                </Link>
                <Link href="/login" className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-colors">
                  List Equipment <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
