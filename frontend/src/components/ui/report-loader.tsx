"use client";
import { useState, useEffect } from "react";

interface ReportLoaderProps {
  isGenerating: boolean;
  text?: string;
}

export function ReportLoader({ isGenerating, text = "Generando reporte con IA..." }: ReportLoaderProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);

    return () => clearInterval(interval);
  }, [isGenerating]);

  if (!isGenerating) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl">
        <div className="text-center">
          {/* Spinner principal con SVG más grande */}
          <div className="mb-4">
            <svg
              width={80}
              height={80}
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-20 h-20 mx-auto"
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
          </div>

          {/* Solo texto simple */}
          <p className="text-gray-600 font-medium">
            Generando...
          </p>
        </div>
      </div>
    </div>
  );
} 