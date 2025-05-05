
import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const Logo: React.FC<LogoProps> = ({ className, size = "md" }) => {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8 md:h-10",
    lg: "h-10 md:h-12",
    xl: "h-12 md:h-24",
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/lovable-uploads/1da42b31-fdee-4d4b-a844-19fa3100d598.png"
        alt="Kolekto Logo"
        className={`${sizeClasses[size]} w-auto`}
      />
    </div>
  );
};

export default Logo;
