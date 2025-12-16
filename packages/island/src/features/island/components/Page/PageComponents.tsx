import React from "react";

interface PageHeaderProps {
  children: React.ReactNode;
}

const PageTitle = ({ children }: PageHeaderProps) => {
  return <h1 className="text-3xl font-bold">{children}</h1>;
};

const PageText = ({ children }: PageHeaderProps) => {
  return <p className="text-lg">{children}</p>;
};

const PageBulletList = ({ children }: PageHeaderProps) => {
  return <ul className="list-disc">{children}</ul>;
};

const PageBulletPoint = ({ children }: PageHeaderProps) => {
  return <li className="text-lg">{children}</li>;
};

export { PageTitle, PageText, PageBulletList, PageBulletPoint };
