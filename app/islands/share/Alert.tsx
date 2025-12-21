import type { FC } from "hono/jsx";
import { useState } from "hono/jsx";

type AlertType = "success" | "danger";
type Props = {
  message: string;
  type: AlertType;
};

export const Alert: FC<Props> = ({ message, type }) => {
  const [isVisible, setIsVisible] = useState(true);
  const closeAlert = () => {
    setIsVisible(!isVisible);
  };
  if (!isVisible) return null;
  // SVGアイコンの定義
  const SuccessIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5 text-green-400"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
        clipRule="evenodd"
      />
    </svg>
  );

  const DangerIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5 text-red-400"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );

  const XMarkIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
    >
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );

  const styles = {
    success: {
      bg: "bg-green-50",
      text: "text-green-800",
      icon: <SuccessIcon />,
      ring: "focus:ring-green-600 focus:ring-offset-green-50",
    },
    danger: {
      bg: "bg-red-50",
      text: "text-red-800",
      icon: <DangerIcon />,
      ring: "focus:ring-red-600 focus:ring-offset-red-50",
    },
  };

  const { bg, text, icon, ring } = styles[type];

  return (
    <div className={`alert-container rounded-md ${bg} p-4 my-4`}>
      <div className="flex">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-3">
          <p className={`text-sm font-medium ${text}`}>{message}</p>
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              className={`alert-dismiss-btn inline-flex rounded-md ${bg} p-1.5 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer ${ring}`}
              onClick={closeAlert}
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
