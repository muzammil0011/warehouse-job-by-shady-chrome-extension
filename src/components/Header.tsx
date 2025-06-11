import { tagline } from "@/../package.json";
import logo from "@/assets/icon.png";
import { useAntd } from "@/providers/ThemeProvider";
import { Avatar } from "antd";
import clsx from "clsx";
function Header() {
  const { token, isDarkTheme } = useAntd();
  return (
    <>
      <header
        className={"border-gray-200 px-2 flex py-3 items-center -mt-0.5 w-full"}
        style={{
          backgroundColor: isDarkTheme
            ? "#252731"
            : hexToRgba(token.colorPrimary, 0.3),
        }}
      >
        <Avatar src={logo} shape="square" className="size-10 mx-4" alt="logo" />
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">{manifest.name}</h1>
          <span
            className={clsx(!isDarkTheme && "text-gray-500", "text-[13px]")}
          >
            {tagline}
          </span>
        </div>
        <span className="absolute top-0 right-0 p-2 text-gray-500 text-[13px]">
          v{manifest.version}
        </span>
      </header>
    </>
  );
}

export default Header;
