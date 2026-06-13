import Link from "next/link";
import { Icon } from "@/components/Icon";

// Entry / role-selection screen (mockups: Onboarding/opener/role_selection)
export default function Opener() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-[486px] bg-gradient-to-b from-secondary-container/40 to-surface -z-10 rounded-b-[40px]" />

      <div className="w-full max-w-[480px] min-h-screen flex flex-col justify-between px-margin-mobile py-margin-mobile relative z-10">
        {/* Header */}
        <header className="flex justify-between items-center pt-safe mb-stack-md">
          <div className="font-headline-md text-headline-md text-primary font-bold">
            PegaBao
          </div>
          <div className="flex bg-surface-container-high rounded-full p-1 border border-outline-variant/30">
            <button className="px-3 py-1 font-label-lg text-label-lg rounded-full bg-primary-container text-white shadow-sm">
              TL
            </button>
            <button className="px-3 py-1 font-label-lg text-label-lg rounded-full text-on-surface-variant">
              EN
            </button>
          </div>
        </header>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center mt-stack-md mb-stack-md">
          <div className="w-full aspect-square max-w-[320px] rounded-full overflow-hidden border-4 border-white flat-shadow mb-stack-md bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center">
            <Icon name="handshake" fill className="text-white text-[120px]" />
          </div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-center text-on-surface mb-stack-sm text-balance">
            Katuwang sa Pag-ayos ng Tahanan
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-[300px]">
            Ikinokonekta ang mga mahuhusay na manggagawa sa mga lokal na
            kabahayan nang may tiwala at bayanihan.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-stack-sm pb-safe w-full mt-auto">
          <Link
            href="/customer"
            className="w-full h-[56px] flex items-center justify-center gap-2 bg-primary-container text-white font-cta text-cta rounded-lg shadow-sm active:scale-[0.98] transition-all"
          >
            <Icon name="home" fill />
            Maghanap ng Serbisyo
          </Link>
          <Link
            href="/worker"
            className="w-full h-[56px] flex items-center justify-center gap-2 bg-secondary-container text-on-secondary-container font-cta text-cta rounded-lg shadow-sm active:scale-[0.98] transition-all"
          >
            <Icon name="home_repair_service" fill />
            Mag-alok ng Serbisyo
          </Link>
          <div className="mt-stack-sm text-center">
            <span className="font-body-md text-body-md text-on-surface-variant">
              May account na?
            </span>
            <Link
              href="/customer"
              className="font-label-lg text-label-lg text-primary ml-1"
            >
              Mag-login dito
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
