import React from "react";
import StatusButton from "./StatusButton";
import "@hackernoon/pixel-icon-library/fonts/iconfont.css";

const StatusBar = () => {
  return (
    <div className="flex justify-between p-4">
      <div className="space-y-2">
        <StatusButton
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M15 2H9v2H7v6h2V4h6zm0 8H9v2h6zm0-6h2v6h-2zM4 16h2v-2h12v2H6v4h12v-4h2v6H4z"
              />
            </svg>
          }
          data={"rikashi_shifu"}
          bgColor="bg-[#6d3f33]"
          orientation="left"
        />
        <StatusButton
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M18 4V2H6v2H1v5h1v2h1v1h1v1h1v1h1v1h3v1h2v3H7v3h10v-3h-4v-3h2v-1h3v-1h1v-1h1v-1h1v-1h1V9h1V4zM8 13H6v-1H5v-1H4V9H3V6h2v1h1v2h1v3h1zm0-4V4h8v5h-1v3h-1v2h-4v-2H9V9zm12 0v2h-1v1h-1v1h-2v-1h1v-2h1V7h1V6h2v3z"
              />
            </svg>
          }
          data={2}
          bgColor="bg-[#68a5ad]"
          orientation="left"
        />
      </div>
      <div className="space-y-2">
        <StatusButton
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 12 12"
            >
              <path
                fill="currentColor"
                d="M5 9H4v1h1Zm0 0h4V8H8V4h1V3H7v1H6v1h1v3H5Zm-5 3h11v-2h-1v1H4v-1H3v1H0Zm4-6h1V4H4Zm5 4h1V9H9ZM3 3h1V2H3Zm2 1h1V3H5ZM4 2h2V1H4Zm2 1h1V2H6Zm3 2h1V4H9ZM7 2h2V1H7Zm0 0"
              />
            </svg>
          }
          data={90}
          bgColor="bg-[#cfa272]"
          orientation="right"
        />
        <StatusButton
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M17 3H7v2H5v2H3v10h2v2h2v2h10v-2h2v-2h2V7h-2V5h-2zm0 2v2h2v10h-2v2H7v-2H5V7h2V5z"
              />
            </svg>
          }
          data={90}
          bgColor="bg-[#5a706b]"
          orientation="right"
        />
      </div>
    </div>
  );
};

/*
  <svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
  >
    <path
      d="M6 2h8v2H6V2zM4 6V4h2v2H4zm0 8H2V6h2v8zm2 2H4v-2h2v2zm8 0v2H6v-2h8zm2-2h-2v2h2v2h2v2h2v2h2v-2h-2v-2h-2v-2h-2v-2zm0-8h2v8h-2V6zm0 0V4h-2v2h2z"
      fill="currentColor"
    />
  </svg>
*/

export default StatusBar;
