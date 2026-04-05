import { PropsWithChildren } from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

type AuthSplitLayoutProps = PropsWithChildren<{
  activeDotIndex?: 0 | 1 | 2;
}>;

export function AuthSplitLayout({ activeDotIndex = 1, children }: AuthSplitLayoutProps) {
  // NOTE: Extracted shared auth page shell to reduce duplication and keep layouts consistent.
  const dots = [0, 1, 2] as const;

  return (
    <div className="h-screen flex bg-white">
      {/* Left Side - Image & Text (shared for sign-in/sign-up) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#7A1226] to-[#65101F] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-30">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop"
            alt="Students coding"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Overlay Content */}
        <div className="relative z-10 flex flex-col justify-end p-12 text-white w-full">
          <h2 className="text-4xl font-bold mb-2">
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
        <div className="absolute top-8 left-8">
          <div className="text-white text-2xl font-bold">Grade Forge</div>
        </div>
      </div>

      {/* Right Side - Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
