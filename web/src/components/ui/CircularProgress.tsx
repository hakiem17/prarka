import React from 'react';

interface CircularProgressProps {
    value: number; // 0 to 100
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
    subLabel?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    value,
    size = 200,
    strokeWidth = 15,
    color = "text-blue-600",
    label,
    subLabel
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {/* Background Circle */}
            <svg
                className="transform -rotate-90 w-full h-full"
                width={size}
                height={size}
            >
                <circle
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress Circle with Animation */}
                <circle
                    className={`${color} transition-all duration-1000 ease-out`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>

            {/* Center Text */}
            <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-bold text-navy-900 dark:text-white">
                    {Math.round(value)}%
                </span>
                {label && (
                    <span className="text-sm text-gray-500 font-medium mt-1">
                        {label}
                    </span>
                )}
                {subLabel && (
                    <span className="text-xs text-gray-400 mt-1">
                        {subLabel}
                    </span>
                )}
            </div>
        </div>
    );
};
