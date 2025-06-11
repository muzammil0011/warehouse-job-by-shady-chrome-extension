import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";

export default function Loader() {
  return (
    <>
      <div className="flex flex-col justify-center items-center gap-4 h-full w-full absolute inset-0 bg-white z-50">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    </>
  );
}
