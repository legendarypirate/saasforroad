"use client";

import { useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function MapEditor() {
  const mapRef = useRef<HTMLDivElement>(null);

  // Script callback → Google Maps API ачаалсны дараа дуудагдана
  const handleInitMap = () => {
    if (!mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 47.9189, lng: 106.9170 }, // УБ төв
      zoom: 13,
    });

    const drawingManager = new window.google.maps.drawing.DrawingManager({
      drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: ["polygon"],
      },
    });
    drawingManager.setMap(map);

    // Polygon зурж дуусах үед
    window.google.maps.event.addListener(
      drawingManager,
      "overlaycomplete",
      (event: any) => {
        if (event.type === "polygon") {
          const path = event.overlay.getPath().getArray();
          const coords = path.map((p: any) => [p.lng(), p.lat()]);
          console.log("Polygon coords:", coords);

          // Backend руу хадгалах
          fetch("/api/polygon", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              district: "БГД",
              horoo: 26,
              coordinates: coords,
            }),
          });
        }
      }
    );
  };

  // initMap-ийг global болгож Google Maps callback-д ашиглана
  if (typeof window !== "undefined") {
    window.initMap = handleInitMap;
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyA8GWeisB2WJgvOOVfKeG6VitUq1yxuXUo&libraries=places,drawing,geometry&callback=initMap`}
        strategy="afterInteractive"
      />
      <div ref={mapRef} className="w-full h-[600px]" />
    </>
  );
}
