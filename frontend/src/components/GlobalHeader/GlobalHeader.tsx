import type { ReactElement } from "react";
import { ThemeToggle } from "../theme-toggle";

export default function GlobalHeader(): ReactElement {
  return (
    <div className="w-full h-22 px-50 border-b flex items-center justify-between">
      <div className="w-186 py-3 flex justify-start gap-5">
        <svg
          width="50"
          height="50"
          viewBox="0 0 50 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="25" cy="25" r="24.5" stroke="#998457" />
          <g clipPath="url(#clip0_712_15778)">
            <path
              d="M42.5872 17.206L34.5412 43H31.4092L24.8752 23.326C24.8152 23.134 24.7552 22.93 24.6952 22.714C24.6472 22.498 24.5932 22.27 24.5332 22.03C24.4732 22.27 24.4132 22.498 24.3532 22.714C24.2932 22.93 24.2332 23.134 24.1732 23.326L17.6032 43H14.4712L6.42519 17.206H9.32319C9.63519 17.206 9.89319 17.284 10.0972 17.44C10.3132 17.596 10.4512 17.794 10.5112 18.034L15.8392 35.962C15.9232 36.286 16.0012 36.634 16.0732 37.006C16.1572 37.378 16.2352 37.774 16.3072 38.194C16.3912 37.774 16.4752 37.378 16.5592 37.006C16.6552 36.622 16.7572 36.274 16.8652 35.962L22.9312 18.034C23.0032 17.83 23.1412 17.644 23.3452 17.476C23.5612 17.296 23.8192 17.206 24.1192 17.206H25.1272C25.4392 17.206 25.6912 17.284 25.8832 17.44C26.0752 17.596 26.2192 17.794 26.3152 18.034L32.3632 35.962C32.4712 36.274 32.5672 36.61 32.6512 36.97C32.7472 37.33 32.8372 37.708 32.9212 38.104C32.9812 37.708 33.0472 37.33 33.1192 36.97C33.1912 36.61 33.2692 36.274 33.3532 35.962L38.6992 18.034C38.7592 17.818 38.8912 17.626 39.0952 17.458C39.3112 17.29 39.5692 17.206 39.8692 17.206H42.5872Z"
              fill="#998457"
            />
          </g>
          <rect x="2.5" y="10.5" width="45" height="39" stroke="#998457" />
          <defs>
            <clipPath id="clip0_712_15778">
              <rect x="2" y="10" width="46" height="40" fill="white" />
            </clipPath>
          </defs>
        </svg>
        <div className="flex flex-col items-center justify-center pt-1 gap-[-2px]!">
          <h2 className="text-[#998457] text-3xl! font-300! -m-0.5 tracking-widest! text-center!">
            WSS
          </h2>
          <p className="text-sm! -m-0.5 opacity-45 text-center!">SGUARDO</p>
        </div>
      </div>
      <div>
        <h3 className="text-nowrap font-normal! pt-1 opacity-50">
          A SEGURANÇA DIGITAL DO SEU MUNDO
        </h3>
      </div>
      <div className="w-186 flex justify-end items-center gap-1.5">
        <ThemeToggle />
        <div className="flex flex-col items-end align-middle px-4 h-full pt-1">
          <p className="-my-0.5">Daniel Moura</p>
          <p className="-my-0.5 opacity-50">Consultor</p>
        </div>
        <div className="border rounded-full w-14 h-14 bg-foreground/10 flex justify-center items-center">
          <p className="font-normal! text-xl! pt-0.5 opacity-60">DM</p>
        </div>
      </div>
    </div>
  );
}
