import type { FC, ReactNode } from "react";
import type { BaseProps } from "@/@types/common";

type Props = BaseProps & {
  type: "primary" | "danger" | "success" | "secondary";
  href: string;
  children: ReactNode;
};

export const ButtonLink: FC<Props> = ({
  className,
  type = "primary",
  href,
  children,
}) => {
  // Tailwind CSSのクラスをタイプに応じて定義
  const baseClasses =
    "px-4 py-2 font-semibold rounded focus:outline-none focus:ring-2";
  const typeClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-300",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-300",
    success: "bg-green-500 text-white hover:bg-green-600 focus:ring-green-300",
    secondary: "bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-300",
  };

  const buttonClasses = `${baseClasses} ${typeClasses[type]} ${className ?? ""}`;

  return (
    <a className={buttonClasses} href={href}>
      {children}
    </a>
  );
};
