"use client";

import { useEffect, useRef } from 'react';

const WIDGET_URL = 'https://widgets.scoreaxis.com/api/football/live-match/6a250d386a80da7c72041d52?widgetId=x37cms770ru3&lang=it&lineupsBlock=1&eventsBlock=1&statsBlock=1&links=1&font=heebo&fontSize=14&rowDensity=100&widgetWidth=auto&widgetHeight=auto&bodyColor=%23ffffff&textColor=%23141416&linkColor=%23141416&borderColor=%23ecf1f7&tabColor=%23f3f8fd';

export default function ScoreAxisLiveWidget() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    const script = document.createElement('script');
    script.src = WIDGET_URL;
    script.async = true;
    container.current.appendChild(script);
    return () => script.remove();
  }, []);

  return <div className="overflow-hidden rounded-xl bg-white">
    <div id="widget-x37cms770ru3" ref={container} className="scoreaxis-widget min-h-40" />
    <div className="px-3 py-2 text-center text-xs text-slate-600">Dati live di <a href="https://www.scoreaxis.com/" target="_blank" rel="noopener noreferrer" className="font-semibold underline">ScoreAxis</a></div>
  </div>;
}
