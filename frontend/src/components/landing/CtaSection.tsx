"use client";

import React from "react";
import { Button } from "../ui/button";

export const CtaSection: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 text-center">
        <div className="w-16 h-1 bg-green-600 mx-auto mb-6 rounded-full" />
        <h2 className="text-4xl font-bold text-green-700 mb-8">
          ¿Estás listo para probar Proogia?
        </h2>
        <Button size="lg" className="bg-green-600 hover:bg-green-700">
          Comenzar
        </Button>
      </div>
    </section>
  );
};
