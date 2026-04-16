import { PropsWithChildren } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

type AuthSplitLayoutProps = PropsWithChildren<{
  activeDotIndex?: 0 | 1 | 2;
}>;

export function AuthSplitLayout({ activeDotIndex = 1, children }: AuthSplitLayoutProps) {
  // NOTE: Extracted shared auth page shell to reduce duplication and keep layouts consistent.
  const dots = [0, 1, 2] as const;

  return (
    <div className="min-h-screen flex flex-col bg-white lg:h-screen lg:flex-row">
      {/* Left Side - Image & Text (shared for sign-in/sign-up) */}
      <div className="relative flex min-h-[240px] w-full overflow-hidden bg-[linear-gradient(135deg,rgba(122,18,38,0.68),rgba(101,16,31,0.68))] lg:min-h-0 lg:w-1/2">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-60">
          <ImageWithFallback
            src="/ulm.jpg"
            alt="Library study space"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Overlay Content */}
        <div className="relative z-10 flex w-full flex-col justify-end p-6 text-white sm:p-8 lg:p-12">
          <h2 className="mb-2 text-3xl font-bold sm:text-4xl">
            Master Coding,
            <br />
            Build Your Future
          </h2>
          
          {/* Pagination Dots */}
          <div className="flex gap-2 mt-8">
            {dots.map((dotIndex) => (
              <div
                key={dotIndex}
                className={`w-8 h-1 rounded-full ${dotIndex === activeDotIndex ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </div>

        {/* Logo */}
        <div className="absolute left-6 top-6 sm:left-8 sm:top-8">
          <div className="text-xl font-bold text-white sm:text-2xl">Grade Forge</div>
        </div>
      </div>

      {/* Right Side - Form Container */}
      <div className="flex w-full items-center justify-center bg-white p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
