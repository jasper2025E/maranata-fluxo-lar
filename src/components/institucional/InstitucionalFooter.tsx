import { Instagram } from "lucide-react";

export function InstitucionalFooter() {
  return (
    <footer className="border-t border-white/[0.08] py-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/escola-logo.png" alt="Reforço Maranata" className="h-7 w-auto opacity-60" />
            <span className="text-xs text-[#666]">
              © {new Date().getFullYear()} Reforço Maranata
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#666]">
            <a
              href="https://www.instagram.com/reforcomaranatabhs/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Instagram className="h-3.5 w-3.5" />
              Instagram
            </a>
            <span>
              por{" "}
              <a
                href="https://www.instagram.com/reforcomaranatabhs/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Victor Mendys
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
