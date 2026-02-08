import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { GradingCodeViewer } from "./GradingCodeViewer";
import { GradingConsole } from "./GradingConsole";

interface GradingLeftPanelProps {
  submission: any;
}

export function GradingLeftPanel({ submission }: GradingLeftPanelProps) {
  return (
    <div className="h-full flex flex-col bg-[#F5F2F2]">
      <PanelGroup direction="vertical">
        {/* Code Viewer */}
        <Panel defaultSize={70} minSize={30}>
          <GradingCodeViewer submission={submission} />
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="h-1 bg-[#2d2d2d] hover:bg-[#5A7ACD] transition-colors relative group">
          <div className="absolute inset-x-0 -top-1 -bottom-1 flex items-center justify-center">
            <div className="h-1 w-12 bg-[#3d3d3d] group-hover:bg-[#5A7ACD] rounded-full transition-colors"></div>
          </div>
        </PanelResizeHandle>

        {/* Console */}
        <Panel defaultSize={30} minSize={15}>
          <GradingConsole submission={submission} />
        </Panel>
      </PanelGroup>
    </div>
  );
}
