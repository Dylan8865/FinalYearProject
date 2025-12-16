import ExpandIcon from '@/icons/ExpandIcon';
import RightArrowIcon from '@/icons/RightArrowIcon';
import React from 'react'

interface SidebarPageProps {
    isOpen?: boolean;
    itemId?: string;
    itemName?: string;
    onClick?: () => void;
}

const onExpand = () => {
    console.log('handle onExpand')
}   

const SidebarPage = ({ isOpen, onClick }: SidebarPageProps) => {
    return (
        <div
            className="
                absolute top-0 right-0 h-full w-[34dvw] bg-[#191919] z-50
                transition-transform duration-300
            "
            style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}
        >
            <div className='flex items-start p-3 gap-3 justify-start h-full'>
                <button className='text-white flex justify-center items-center' onClick={onClick}>
                    <RightArrowIcon />
                </button>
                <button className='text-white flex justify-center items-center' onClick={onExpand}>
                    <ExpandIcon />
                </button>
            </div>
        </div>
    );
};

export default SidebarPage