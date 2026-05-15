import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ADCSimulator from "./components/ADCSimulator";
import DataEncoding from "./components/DataEncoding";

export default function App() {
  const [activeModule, setActiveModule] = useState<"adc" | "encoding">("encoding");

  return (
    <div className="dark size-full flex bg-[#0a0a0f] text-white overflow-hidden">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />

      <main className="flex-1 overflow-auto">
        {activeModule === "adc" ? <ADCSimulator /> : <DataEncoding />}
      </main>
    </div>
  );
}
