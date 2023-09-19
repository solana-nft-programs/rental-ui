import { FaDiscord, FaGithub, FaMedium, FaTwitter } from 'react-icons/fa'
import { LogoTitled } from 'rental-components/common/LogoTitled'

export const SOCIALS = {
  discord: { icon: <FaDiscord />, link: 'https://discord.gg/byq6uNTugq' },
  github: { icon: <FaGithub />, link: 'https://github.com/' },
  medium: { icon: <FaMedium />, link: 'https://.medium.com/' },
  twitter: { icon: <FaTwitter />, link: 'https://twitter.com/' },
}

export const Footer = ({
  accentColor = '#FFFFFF',
}: {
  accentColor?: string
}) => {
  return (
    <div className="mt-10 bg-white bg-opacity-5 px-10 pt-5 shadow-2xl md:px-32">
      <div className="flex w-full flex-wrap items-start justify-between gap-10 py-10">
        <div className="flex items-center">
          <LogoTitled className="inline-block h-6" />
          {/* 
          <img
            alt=" logo"
            className="inline-block h-[28px]"
            src="/-crosshair.svg"
          />
          <span className="ml-3 text-2xl font-semibold text-white">
            
          </span> */}
        </div>
        <div className="flex gap-10 self-end text-center md:gap-20">
          <span className="flex flex-col items-start gap-1">
            <div className="mb-2 text-lg font-semibold text-white">
              Resources
            </div>
            <a href="https://docs.host.so/" className="text-gray-400">
              Documentation
            </a>
            <a href="https://github.com/" className="text-gray-400">
              Github
            </a>
            <a href="mailto:team@host.so" className="text-gray-400">
              Contact
            </a>
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border py-8 text-sm text-gray-400">
        <div className="flex items-center justify-center gap-2 text-gray-400">
          Powered by
        </div>
        <div className="flex gap-4 text-gray-200">
          {Object.entries(SOCIALS).map(([id, { icon, link }]) => {
            return (
              <a
                key={id}
                href={link}
                target="_blank"
                rel="noreferrer"
                style={{ color: accentColor }}
                className={`opacity-80 transition-opacity hover:text-primary hover:opacity-100`}
              >
                {icon}
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
