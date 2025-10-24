import "../../index.css";
import "../../styling/control.css";
import { DashboardProviderContext } from "../../provider/DashboardProvider";
import { DashboardControlToggle } from "./DashboardControlToggle";
import { useContext } from "react";
import { ConstantControlText } from "../../constant/Constant";
import image from "../../assets/fan.png";

export const DashboardControl = () => {
  const { isAutoMode, setIsAutoMode, isControlOn, setIsControlOn } = useContext(
    DashboardProviderContext
  );
  return (
    <div className="control-container">
      <h3 className="control-title">{ConstantControlText.title}</h3>

      <DashboardControlToggle
        label={ConstantControlText.autoLabel}
        isOn={isAutoMode}
        isDisabled={false}
        setIsOn={setIsAutoMode}
      />

      <DashboardControlToggle
        label={ConstantControlText.controlLabel}
        isOn={isControlOn}
        isDisabled={isAutoMode}
        setIsOn={setIsControlOn}
      />

      <img
        src={image}
        alt={ConstantControlText.fanImgAlt}
        className="control-image"
      />
    </div>
  );
};
