"use client";

import { useState } from "react";
import { KidParentsCard } from "./KidParentsCard";
import { LinkParentModal } from "./LinkParentModal";
import type { LinkedParent } from "./kids-data";

type KidParentsSectionProps = {
  childName: string;
  sectionLabel: string;
  linkAnotherParentLabel: string;
  parents: LinkedParent[];
};

export function KidParentsSection({
  childName,
  sectionLabel,
  linkAnotherParentLabel,
  parents,
}: KidParentsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSession, setModalSession] = useState(0);

  const handleOpenModal = () => {
    setModalSession((current) => current + 1);
    setIsModalOpen(true);
  };

  return (
    <>
      <KidParentsCard
        sectionLabel={sectionLabel}
        linkAnotherParentLabel={linkAnotherParentLabel}
        parents={parents}
        onLinkAnotherParent={handleOpenModal}
      />
      <LinkParentModal
        key={modalSession}
        open={isModalOpen}
        childName={childName}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}