interface AILoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function AILoader({
  size = "md",
  text = "Analizando con IA...",
  className = "",
}: AILoaderProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-3 ${className}`}
    >
      <svg
        width={size === "sm" ? 32 : size === "md" ? 48 : 64}
        height={size === "sm" ? 32 : size === "md" ? 48 : 64}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={sizeClasses[size]}
      >
        {/* Central "Brain" Node - Pulsing */}
        <circle cx="50" cy="50" r="15" fill="#4CAF50" opacity="0.8">
          <animate
            attributeName="r"
            values="15;18;15"
            dur="3s"
            repeatCount="indefinite"
            keyTimes="0;0.5;1"
            calcMode="spline"
            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
          />
          <animate
            attributeName="opacity"
            values="0.8;1;0.8"
            dur="3s"
            repeatCount="indefinite"
            keyTimes="0;0.5;1"
            calcMode="spline"
            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
          />
        </circle>

        {/* Orbiting Nodes and Connecting Lines */}
        <g transform="rotate(0 50 50)">
          {/* Group for rotation */}
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="8s"
            repeatCount="indefinite"
          />

          {/* Node 1 */}
          <circle cx="50" cy="25" r="6" fill="#8BC34A" opacity="0.9">
            <animate
              attributeName="opacity"
              values="0.9;0.6;0.9"
              dur="2.5s"
              begin="0s"
              repeatCount="indefinite"
            />
          </circle>
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="25"
            stroke="#388E3C"
            strokeWidth="3.125"
            strokeLinecap="round"
            strokeDasharray="10 10"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0; -20"
              dur="2s"
              repeatCount="indefinite"
            />
          </line>

          {/* Node 2 */}
          <circle cx="71.65" cy="62.5" r="6" fill="#8BC34A" opacity="0.9">
            <animate
              attributeName="opacity"
              values="0.9;0.6;0.9"
              dur="2.5s"
              begin="0.8s"
              repeatCount="indefinite"
            />
          </circle>
          <line
            x1="50"
            y1="50"
            x2="71.65"
            y2="62.5"
            stroke="#388E3C"
            strokeWidth="3.125"
            strokeLinecap="round"
            strokeDasharray="10 10"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0; -20"
              dur="2s"
              begin="0.5s"
              repeatCount="indefinite"
            />
          </line>

          {/* Node 3 */}
          <circle cx="28.35" cy="62.5" r="6" fill="#8BC34A" opacity="0.9">
            <animate
              attributeName="opacity"
              values="0.9;0.6;0.9"
              dur="2.5s"
              begin="1.6s"
              repeatCount="indefinite"
            />
          </circle>
          <line
            x1="50"
            y1="50"
            x2="28.35"
            y2="62.5"
            stroke="#388E3C"
            strokeWidth="3.125"
            strokeLinecap="round"
            strokeDasharray="10 10"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="0; -20"
              dur="2s"
              begin="1s"
              repeatCount="indefinite"
            />
          </line>
        </g>
      </svg>

      {text && (
        <p className="text-sm text-gray-600 font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
