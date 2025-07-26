import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StoredChart, ChartButton } from "./Chart";
import { Range, ActionButton as ActionButtonType } from "@/contexts/RangeContext";
import { PokerMatrix } from "@/components/PokerMatrix";
import { useRangeContext } from "@/contexts/RangeContext";

// Legend Component
const Legend = ({ usedActions }: { usedActions: ActionButtonType[] }) => {
  if (usedActions.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
      {usedActions.map(action => (
        <div key={action.id} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-sm border"
            style={{ backgroundColor: action.type === 'simple' ? action.color : 'transparent' }}
          />
          <span className="text-sm font-medium">{action.name}</span>
        </div>
      ))}
    </div>
  );
};


interface ChartViewerProps {
  isMobileMode?: boolean;
  chart: StoredChart;
  allRanges: Range[];
  onBackToCharts: () => void;
}

const CustomDialog = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    // Use a container that takes up the full screen to center the content
    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4" 
            onClick={onClose}
        >
            <div 
                className="bg-background p-4 rounded-lg shadow-2xl" 
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the content
            >
                {children}
            </div>
        </div>
    );
};

export const ChartViewer = ({ isMobileMode = false, chart, allRanges, onBackToCharts }: ChartViewerProps) => {
  const { actionButtons } = useRangeContext();
  const [displayedRange, setDisplayedRange] = useState<Range | null>(null);
  const [showMatrixDialog, setShowMatrixDialog] = useState(false);
  const [activeButton, setActiveButton] = useState<ChartButton | null>(null); // State to store the active button
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isMobileMode) {
      const handleResize = () => {
        setViewportSize({ width: window.innerWidth, height: window.innerHeight });
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isMobileMode]);

  const handleButtonClick = (button: ChartButton) => {
    if (button.type === 'exit' || button.type === 'label') {
      onBackToCharts(); // Assuming exit is the only non-range action for now
      return;
    }

    const linkedRange = allRanges.find(range => range.id === button.linkedItem);
    if (linkedRange) {
      setDisplayedRange(linkedRange);
      setActiveButton(button); // Store the clicked button
      setShowMatrixDialog(true);
    } else {
      alert("Привязанный диапазон не найден.");
    }
  };
  
  const handleCloseDialog = () => {
    setShowMatrixDialog(false);
    setDisplayedRange(null);
    setActiveButton(null);
  }

  // Determine which actions are used in the currently displayed range
  const usedActions = React.useMemo(() => {
    if (!displayedRange) return [];
    
    const usedActionIds = new Set(Object.values(displayedRange.hands));
    
    return actionButtons.filter(action => usedActionIds.has(action.id));

  }, [displayedRange, actionButtons]);


  const scale = (isMobileMode && viewportSize.width > 0 && chart.canvasWidth > 0)
    ? Math.min(
        (viewportSize.width * 0.95) / chart.canvasWidth,
        (viewportSize.height * 0.95) / chart.canvasHeight
      )
    : 1;

  return (
    <>
      <div className={cn(
        "p-6",
        isMobileMode
          ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-2"
          : "min-h-screen"
      )}>
        <div className={cn(
          "max-w-4xl mx-auto",
          isMobileMode ? "w-full h-full flex flex-col items-center justify-center" : "w-full"
        )}>
          <div
            className="relative border-2 border-solid border-muted-foreground rounded-lg bg-card flex items-center justify-center overflow-hidden"
            style={isMobileMode ? {
              width: chart.canvasWidth,
              height: chart.canvasHeight,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            } : {
              width: '100%',
              height: '500px',
            }}
          >
            {chart.buttons.map((button) => (
              <Button
                key={button.id}
                style={{
                  backgroundColor: button.color,
                  position: 'absolute',
                  left: button.x,
                  top: button.y,
                  width: button.width,
                  height: button.height,
                }}
                className={cn(
                  "flex items-center justify-center rounded-md shadow-md text-white font-semibold z-20",
                  button.type !== 'label' && "cursor-pointer hover:opacity-90 transition-opacity"
                )}
                onClick={() => handleButtonClick(button)}
              >
                {button.name}
              </Button>
            ))}
            {chart.buttons.length === 0 && (
              <p className="text-muted-foreground z-10">В этом чарте нет кнопок.</p>
            )}
          </div>
        </div>
      </div>

      <CustomDialog isOpen={showMatrixDialog} onClose={handleCloseDialog}>
          {displayedRange && (
            <div>
              <PokerMatrix
                selectedHands={displayedRange.hands}
                onHandSelect={() => {}}
                activeAction=""
                actionButtons={actionButtons}
                readOnly={true}
                isBackgroundMode={false}
              />
              {activeButton?.showLegend && <Legend usedActions={usedActions} />}
            </div>
          )}
      </CustomDialog>
    </>
  );
};
