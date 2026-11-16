import Link from "next/link";

export function InvalidInvitationState() {
  return (
    <div className="rounded-[20px] border border-[#EADFD1] bg-white/70 px-6 py-7 text-center shadow-[0_8px_24px_-18px_rgba(63,54,46,0.35)] sm:px-8 sm:py-8">
      <p className="m-0 font-(family-name:--font-fredoka) text-[24px] font-semibold leading-[1.2] text-[#3F362E]">
        Invitación no válida
      </p>
      <p className="m-0 mt-3 text-[14.5px] leading-[1.55] text-[#94887B]">
        El enlace de invitación no es válido o ya no está disponible.
      </p>
      <Link
        href="/login"
        className="mt-6 flex h-12 w-full items-center justify-center rounded-[15px] bg-[#3F362E] px-4 text-[15px] font-extrabold !text-white transition-opacity hover:opacity-95"
      >
        Ir a iniciar sesión
      </Link>
    </div>
  );
}
