"use client";

export default function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute w-64 h-64 bg-white/5 rounded-full blur-3xl animate-float-1"
        style={{ top: "10%", left: "-10%" }}
      />
      <div
        className="absolute w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-float-2"
        style={{ top: "50%", right: "-20%" }}
      />
      <div
        className="absolute w-48 h-48 bg-white/5 rounded-full blur-2xl animate-float-1"
        style={{ bottom: "20%", left: "20%", animationDelay: "-5s" }}
      />
      <div className="absolute top-20 right-10 w-2 h-2 bg-white/20 rounded-full" />
      <div className="absolute top-40 left-20 w-3 h-3 bg-white/10 rounded-full" />
      <div className="absolute bottom-40 right-20 w-2 h-2 bg-white/15 rounded-full" />
    </div>
  );
}
