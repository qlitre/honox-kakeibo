import { useState, FC } from 'react'
import { Button } from '@/islands/Button'
import { ReactNode } from 'react'

type Props = {
    buttonType: 'primary' | 'success'
    buttonTitle: string
    children: ReactNode
}

export const CreateModal: FC<Props> = ({ buttonType, buttonTitle, children }) => {
    const [open, setOpen] = useState(false)
    const handleClick = () => {
        setOpen(true)
    }
    return (
        <>
            <Button type={buttonType} onClick={handleClick}>{buttonTitle}</Button>
            {open && (
                <div className="fixed inset-0 z-10 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                        onClick={() => setOpen(false)}
                    ></div>

                    {/* Dialog Panel */}
                    <div className="relative z-20 w-full max-w-md transform overflow-hidden rounded-lg bg-white px-6 py-4 shadow-xl transition-all sm:max-w-lg">
                        {children}
                    </div>
                </div>
            )}
        </>
    )
}
