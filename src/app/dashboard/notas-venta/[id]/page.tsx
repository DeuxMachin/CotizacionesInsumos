"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { SalesNoteDetail } from '@/features/sales-notes/ui/SalesNoteDetail';

export default function NotaVentaDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  return <SalesNoteDetail id={id} />;
}
