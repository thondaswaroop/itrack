import React from "react";

interface AvatarProps {
  firstName: string;
  middleName:string;
  lastName: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  firstName,
  middleName,
  lastName,
  size = 50,
  textColor = "#fff",
}) => {
  const initials = `${firstName?.[0] || ""}${middleName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    color: textColor,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: size / 3,
    fontWeight: "bold",
    userSelect: "none",
  };

  return <div style={style} className="bg-blue-600">{initials}</div>;
};

export default Avatar;
