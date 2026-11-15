import { KidInfoRow } from "./KidInfoRow";
import type { KidProfile } from "./kids-data";

type KidInfoCardProps = {
  profile: KidProfile;
};

export function KidInfoCard({ profile }: KidInfoCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#ECE0D0] bg-[#FFFDF9]">
      <KidInfoRow label="Fecha de nacimiento" value={profile.birthDateLabel} withBorder />
      <KidInfoRow label="Sala" value={profile.roomLabel} withBorder />
      <KidInfoRow label="Ingreso" value={profile.admissionLabel} />
    </div>
  );
}
