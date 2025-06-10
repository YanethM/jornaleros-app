import React from "react";
import ScreenLayoutWorker from "../../components/ScreenLayoutWorker";
import CustomTabBarWorker from "../../components/CustomTabBarWorker";

const WorkerApplicationDetail = ({ navigation }) => {
  return (
    <ScreenLayoutWorker navigation={navigation}>
      <CustomTabBarWorker navigation={navigation} currentRoute="RateProducer" />
    </ScreenLayoutWorker>
  );
};

export default WorkerApplicationDetail;
