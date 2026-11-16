"use client";

import { useEffect, useState } from "react";
import { KidParentsCard } from "./KidParentsCard";
import { LinkParentModal } from "./LinkParentModal";
import type { LinkedParent } from "./kids-data";

type KidParentsSectionProps = {
  childId: string;
  childName: string;
  sectionLabel: string;
  linkAnotherParentLabel: string;
  parents: LinkedParent[];
};

export function KidParentsSection({
  childId,
  childName,
  sectionLabel,
  linkAnotherParentLabel,
  parents,
}: KidParentsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSession, setModalSession] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!successMessage) return;
    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  const handleOpenModal = () => {
    setModalSession((current) => current + 1);
    setIsModalOpen(true);
  };

  const handleInvitationSuccess = (email: string) => {
    setSuccessMessage(`Invitación enviada a ${email}`);
  };

  return (
    <>
      {successMessage ? (
        <div
          role="status"
          className="rounded-[14px] border border-[#BFE3C8] bg-[#EAF7EE] px-4 py-3 text-[14px] font-semibold text-[#2E6B3F]"
        >
          {successMessage}
        </div>
      ) : null}
      <KidParentsCard
        sectionLabel={sectionLabel}
        linkAnotherParentLabel={linkAnotherParentLabel}
        parents={parents}
        onLinkAnotherParent={handleOpenModal}
      />
      <LinkParentModal
        key={modalSession}
        open={isModalOpen}
        childId={childId}
        childName={childName}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleInvitationSuccess}
      />
    </>
  );
}
