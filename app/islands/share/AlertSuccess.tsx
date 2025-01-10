import type { FC } from 'react';
import { useState } from 'react';
import { CheckCircleIcon, XMarkIcon, ExclamationCircleIcon } from '@heroicons/react/20/solid';

type AlertType = 'success' | 'danger';
type Props = {
    message: string;
    type: AlertType;
};

export const Alert: FC<Props> = ({ message, type }) => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    // Typeごとのスタイルとアイコンを設定
    const styles = {
        success: {
            bg: 'bg-green-50',
            text: 'text-green-800',
            iconBg: 'text-green-400',
            icon: CheckCircleIcon,
        },
        danger: {
            bg: 'bg-red-50',
            text: 'text-red-800',
            iconBg: 'text-red-400',
            icon: ExclamationCircleIcon,
        },
    };

    const { bg, text, iconBg, icon: Icon } = styles[type];

    return (
        <div className={`rounded-md ${bg} p-4 my-4`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    <Icon aria-hidden="true" className={`h-5 w-5 ${iconBg}`} />
                </div>
                <div className="ml-3">
                    <p className={`text-sm font-medium ${text}`}>{message}</p>
                </div>
                <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                        <button
                            type="button"
                            className={`inline-flex rounded-md ${bg} p-1.5 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type === 'success' ? 'green' : 'red'}-600 focus:ring-offset-${type === 'success' ? 'green' : 'red'}-50`}
                            onClick={() => setIsVisible(false)}
                        >
                            <span className="sr-only">Dismiss</span>
                            <XMarkIcon aria-hidden="true" className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
