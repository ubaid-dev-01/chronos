import { cn } from "@/lib/utils";

const BRANDS = [
  { name: "Vercel", Icon: VercelIcon },
  { name: "Linear", Icon: LinearIcon },
  { name: "Stripe", Icon: StripeIcon },
  { name: "Notion", Icon: NotionIcon },
  { name: "Raycast", Icon: RaycastIcon },
  { name: "Framer", Icon: FramerIcon },
] as const;

export function LogoStrip({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "border-y border-border bg-surface/40 py-16 md:py-20",
        className
      )}
    >
      <div className="container-main">
        <p className="mb-12 text-center text-base font-semibold uppercase tracking-[0.16em] text-text-tertiary md:mb-14 md:text-lg">
          Teams that switched to Chronos
        </p>

        <div className="grid grid-cols-2 place-items-center gap-x-8 gap-y-12 sm:grid-cols-3 md:grid-cols-6 md:gap-x-6">
          {BRANDS.map(({ name, Icon }) => (
            <div
              key={name}
              className="group flex flex-col items-center gap-4 transition-transform hover:scale-105"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface-elevated/80 shadow-sm transition-colors group-hover:border-text-tertiary/30 group-hover:bg-surface-elevated md:h-20 md:w-20">
                <Icon className="h-9 w-9 text-text-primary md:h-10 md:w-10" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-text-secondary transition-colors group-hover:text-text-primary md:text-xl">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VercelIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 76 65" fill="currentColor" className={className} aria-hidden>
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
    </svg>
  );
}

function LinearIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.22541 61.5228c-.2225-.9485.90775-1.5459 1.59638-.8573l39.9442 39.9442c.6886.6886.0912 1.8189-.8573 1.5964C20.0515 99.4522 1.54774 80.9485 1.22541 61.5228ZM.00189135 46.8891c-.01764375.2833.08887215.5599.28951065.7605L52.3503 99.7085c.2006.2006.4772.3071.7605.2895 19.4257-.3224 37.9294-18.8261 38.2518-38.2518.0176-.2833-.0889-.5599-.2895-.7605L47.6395 1.73737c-.2006-.20064-.4772-.30714-.7605-.28951C27.4533 1.77034 8.94958 20.274 8.62725 39.6997 8.60961 39.983 8.71612 40.2596 8.91675 40.4602L59.5402 91.0837c.2006.2006.4772.3071.7605.2895 12.7018-.2111 24.7892-12.2985 25.0003-25.0003.0176-.2833-.0889-.5599-.2895-.7605L35.7605 1.73737c-.2006-.20064-.4772-.30714-.7605-.28951C13.2987 1.77034.00189135 24.4634.00189135 46.8891Z"
      />
    </svg>
  );
}

function StripeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
    </svg>
  );
}

function NotionIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.449.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM2.163 2.023l13.215-.98c1.635-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-2.055V3.57c0-.84.374-1.54 1.243-1.547z" />
    </svg>
  );
}

function RaycastIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path fillRule="evenodd" clipRule="evenodd" d="M12.5 2.5a10 10 0 1 0 10 10h-2.5a7.5 7.5 0 1 1-7.5-7.5V2.5Zm0 5a5 5 0 1 0 5 5h-2.5a2.5 2.5 0 1 1-2.5-2.5V7.5Zm0 5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
      <path d="M3 3l7 7M3 10l4-4M10 3L3 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

function FramerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M4 0h16v8h-8Zm0 8h8l8 8H4Zm0 8h8v8H4Z" />
    </svg>
  );
}
