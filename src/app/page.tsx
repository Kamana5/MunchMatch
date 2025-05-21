import NearbyPlaces from "~/app/NearbyPlaces/page";
import LandingPage from "~/app/landing";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center text-white overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/backround.mp4" type="video/mp4" />
      </video>

      {/* Foreground Content with Brown Border */}
      <div className="relative z-10 container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="border-4 border-[#8B4513] rounded-xl p-8 bg-black/60">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem] text-center">
            Munch <span className="text-[hsl(281, 100.00%, 70.00%)]">Match</span>
          </h1>
          <LandingPage />
        </div>
      </div>
    </main>
  );
}
